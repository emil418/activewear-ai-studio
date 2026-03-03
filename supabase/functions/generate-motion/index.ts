import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MODEL_ROUTER: Record<string, string> = {
  analyze: "google/gemini-3-flash-preview",
  generate_image: "google/gemini-2.5-flash-image",
  describe_physics: "google/gemini-2.5-flash",
  remove_bg: "google/gemini-2.5-flash-image",
};

// ── Helper: remove background from an image using AI ──
async function removeBackground(base64Image: string, apiKey: string, label: string): Promise<string> {
  console.log(`Removing background from ${label}...`);
  try {
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ROUTER.remove_bg,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Remove the background from this image completely. Output ONLY the foreground object (the ${label}) on a fully transparent background. Keep the original colors, details, and quality of the foreground object 100% intact. Do NOT alter, tint, or recolor any part of the foreground. The result must be a clean cutout with no background remnants, no color bleeding, and no artifacts.`,
              },
              { type: "image_url", image_url: { url: base64Image } },
            ],
          },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const choice = data.choices?.[0]?.message;

      // Extract image from response
      let resultUrl: string | null = null;
      if (choice?.images && Array.isArray(choice.images)) {
        for (const img of choice.images) {
          if (img?.image_url?.url) { resultUrl = img.image_url.url; break; }
        }
      } else if (choice?.content && Array.isArray(choice.content)) {
        for (const part of choice.content) {
          if (part.type === "image_url" && part.image_url?.url) { resultUrl = part.image_url.url; break; }
        }
      }

      if (resultUrl) {
        console.log(`Background removed successfully for ${label}`);
        return resultUrl;
      }
    }
    console.warn(`Background removal failed for ${label}, using original`);
  } catch (e) {
    console.warn(`Background removal error for ${label}:`, e);
  }
  return base64Image; // fallback to original
}

// ── Helper: extract image from AI response ──
function extractImageFromResponse(choice: Record<string, unknown>): string | null {
  if (choice?.images && Array.isArray(choice.images)) {
    for (const img of choice.images) {
      if (img?.image_url?.url) return img.image_url.url;
    }
  }
  if (choice?.content && Array.isArray(choice.content)) {
    for (const part of (choice.content as Array<Record<string, unknown>>)) {
      if (part.type === "image_url" && (part.image_url as Record<string, string>)?.url) {
        return (part.image_url as Record<string, string>).url;
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { garmentName, garmentBase64, gender, size, bodyType, movement, intensity, logoBase64, logoPosition } = await req.json();
    // logoPosition: { x: number, y: number, placement: string } | undefined

    // ── Step 0: Pre-process uploads – remove backgrounds ──
    console.log("Step 0: Removing backgrounds from uploaded images...");

    const bgRemovalPromises: Promise<string>[] = [];
    bgRemovalPromises.push(
      garmentBase64
        ? removeBackground(garmentBase64, LOVABLE_API_KEY, "garment/clothing")
        : Promise.resolve("")
    );
    bgRemovalPromises.push(
      logoBase64
        ? removeBackground(logoBase64, LOVABLE_API_KEY, "brand logo")
        : Promise.resolve("")
    );

    const [cleanGarment, cleanLogo] = await Promise.all(bgRemovalPromises);
    const processedGarment = cleanGarment || garmentBase64;
    const processedLogo = cleanLogo || logoBase64;

    console.log("Background removal complete.");

    // ── Step 1: Analyze garment ──
    console.log("Step 1: Analyzing garment...");
    let garmentAnalysis: Record<string, unknown> = {
      fabric_type: "High-compression polyester-elastane blend",
      garment_category: "Training T-Shirt",
      color_palette: ["#1a1a1a"],
      stretch_rating: 8,
      compression_level: "High",
      breathability_rating: 7,
      recommended_use: ["HIIT", "Strength", "CrossFit"],
    };

    try {
      const analysisResp = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_ROUTER.analyze,
          messages: [
            {
              role: "system",
              content: `You are an expert activewear and sportswear fabric analyst. You ONLY analyze athletic clothing.
IMPORTANT: The image background has been removed (transparent). Focus ONLY on the foreground clothing item. Completely ignore any background remnants, artifacts, or transparency.
Analyze the garment and return JSON with EXACTLY these fields:
- fabric_type: string – describe the actual fabric composition (e.g. "High-compression polyester-elastane blend", "Moisture-wicking nylon mesh"). Be specific about the material.
- garment_category: string (ONLY one of: "T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"). Pick the BEST match for the uploaded athletic clothing.
- color_palette: array of hex strings – analyze the ACTUAL fabric color from the foreground pixels only. If the fabric is black, return ["#1a1a1a"] or similar dark hex. NEVER let background color influence this.
- stretch_rating: number 1-10
- compression_level: string ("Light", "Medium", "High", "Ultra-High")
- breathability_rating: number 1-10
- recommended_use: array of strings (e.g. ["HIIT", "Strength", "Running", "Yoga", "CrossFit", "Cardio"])
ABSOLUTE RULES:
- This is ALWAYS athletic/sportswear clothing. NEVER categorize as jewelry, metal, cufflinks, accessories, or any non-sportswear item.
- The color must reflect the ACTUAL garment fabric, not background or transparency.
- Return ONLY valid JSON, no markdown fences, no extra text.`,
            },
            {
              role: "user",
              content: processedGarment
                ? [
                    { type: "text", text: `Analyze this uploaded activewear/sportswear garment called "${garmentName}". The background has been removed – focus ONLY on the clothing item itself. This is ALWAYS athletic training clothing. Identify the actual fabric color (ignore background), fabric composition, stretch, compression, breathability. Categorize as one of: T-Shirt, Compression T-Shirt, Leggings, Shorts, Sports Bra, Training Top, Tank Top, Hoodie, Joggers. NEVER categorize as jewelry, metal, cufflinks, or non-sportswear.` },
                    { type: "image_url", image_url: { url: processedGarment } },
                  ]
                : `Analyze an activewear garment called "${garmentName}". Categorize as activewear. Return analysis JSON.`,
            },
          ],
        }),
      });

      if (analysisResp.ok) {
        const analysisData = await analysisResp.json();
        const content = analysisData.choices?.[0]?.message?.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate garment_category is activewear
          const validCategories = ["T-Shirt", "Compression T-Shirt", "Leggings", "Shorts", "Sports Bra", "Training Top", "Compression Tights", "Tank Top", "Hoodie", "Joggers"];
          if (parsed.garment_category && !validCategories.includes(parsed.garment_category)) {
            parsed.garment_category = "T-Shirt"; // safe fallback
          }
          garmentAnalysis = parsed;
        }
      } else {
        console.error("Analysis failed:", analysisResp.status, await analysisResp.text());
      }
    } catch (e) {
      console.error("Analysis parse error:", e);
    }

    // ── Step 2: Physics description ──
    console.log("Step 2: Generating physics description...");
    let physicsData = {
      stretch_factor: "4×",
      compression_percentage: 85,
      sweat_absorption: 92,
      breathability_score: 78,
      stress_zones: ["knees", "glutes", "waistband"],
      performance_notes: "Good stretch recovery under load.",
    };

    try {
      const physicsResp = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_ROUTER.describe_physics,
          messages: [
            {
              role: "system",
              content: "You are a sportswear physics engine. Given garment details and movement, return JSON with: stretch_factor (e.g. '4x'), compression_percentage (0-100), sweat_absorption (0-100), breathability_score (0-100), stress_zones (array of strings), performance_notes (string). Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: `Garment: ${JSON.stringify(garmentAnalysis)}. Athlete: ${gender}, size ${size}, ${bodyType} build. Movement: ${movement} at ${intensity}% intensity.`,
            },
          ],
        }),
      });

      if (physicsResp.ok) {
        const physicsJson = await physicsResp.json();
        const physContent = physicsJson.choices?.[0]?.message?.content || "{}";
        const jsonMatch = physContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) physicsData = { ...physicsData, ...JSON.parse(jsonMatch[0]) };
      }
    } catch (e) {
      console.error("Physics parse error:", e);
    }

    // ── Step 3: Generate multi-angle images (PARALLEL) ──
    console.log("Step 3: Generating motion images in parallel...");
    const angles = ["front", "side", "back"];
    const MAX_RETRIES = 3;

    async function generateAngle(angle: string): Promise<string | null> {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        attempts++;
        try {
          console.log(`Generating ${angle} view (attempt ${attempts})...`);

          const placementLabel = logoPosition?.placement || "chest-center";
          const isFrontPlacement = placementLabel.startsWith("chest") || placementLabel === "belly-center" || placementLabel === "upper" || placementLabel === "middle";
          const isBackPlacement = placementLabel.startsWith("back");
          const isSleevePlacement = placementLabel.startsWith("sleeve");

          const logoInstructions = processedLogo ? `
LOGO RULES (CRITICAL – NO EXCEPTIONS):
- The brand logo has been provided with its background REMOVED (transparent cutout)
- The user placed the logo at position: "${placementLabel}"
- The logo must appear ONLY on that exact location – NEVER duplicate it on other areas
- For "${angle}" view:
  ${angle === "front" && isFrontPlacement ? `Show the logo clearly visible at the ${placementLabel} position` : ""}
  ${angle === "front" && isBackPlacement ? "Do NOT show any logo – it was placed on the back" : ""}
  ${angle === "front" && isSleevePlacement ? `Show the logo on the ${placementLabel.includes("left") ? "left" : "right"} sleeve from front view` : ""}
  ${angle === "side" ? (isFrontPlacement ? "Show the logo partially visible from the side if the placement is near the edge, otherwise not visible" : isBackPlacement ? "Do NOT show the logo from the side" : `Show the ${placementLabel} partially visible`) : ""}
  ${angle === "back" && isBackPlacement ? `Show the logo clearly visible at ${placementLabel}` : ""}
  ${angle === "back" && !isBackPlacement ? "Do NOT show any logo – it was NOT placed on the back" : ""}
- Keep the logo's ORIGINAL colors EXACTLY as-is – do NOT recolor, tint, darken, lighten, invert, or blend with garment color
- The logo should follow the fabric's natural stretch and movement realistically
- The logo must appear EXACTLY ONCE on the entire garment – no duplication` : "";

          const imageResp = await fetch(AI_GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL_ROUTER.generate_image,
              modalities: ["image", "text"],
              messages: [
                {
                  role: "user",
                  content: processedGarment
                    ? [
                        { type: "text", text: `CRITICAL INSTRUCTIONS (MUST FOLLOW):
1. GARMENT REFERENCE: The uploaded garment image has its background REMOVED. Use ONLY the foreground clothing as the strict reference. Do NOT pick up any background color or blend background into the garment. The garment's actual color and fabric must be preserved EXACTLY.
2. NO COLOR BLEEDING: If the garment is black, it MUST remain black. If white, it MUST remain white. Do NOT let any background, studio lighting, or other element change the garment's true color.
3. STRICT FIDELITY: The athlete must wear THIS EXACT garment – same shape, color, fabric texture, seams, fit, and all visual details. Do NOT invent, replace, or modify the clothing in any way.

Generate a professional studio photo of a ${gender} athlete (${bodyType} build, size ${size}) wearing EXACTLY this uploaded garment while performing ${movement} at ${intensity}% intensity. ${angle} view angle.

Requirements:
- The garment color and fabric must match the uploaded reference EXACTLY – no color shifts, no background color contamination
- Show realistic stretch, compression, and motion appropriate to the movement
- Dark studio background with dramatic lighting (lighting must NOT wash out or change garment color)
- Professional sportswear campaign photo quality (Nike/Adidas style)
- The garment is the HERO – it must be instantly recognizable as the exact same item${logoInstructions}` },
                        { type: "image_url", image_url: { url: processedGarment } },
                        ...(processedLogo ? [{ type: "image_url", image_url: { url: processedLogo } }] : []),
                      ]
                    : `Generate a professional studio photo of a ${gender} athlete (${bodyType} build, size ${size}) wearing dark athletic activewear performing ${movement} at ${intensity}% intensity. ${angle} view angle. Dark studio background with dramatic lighting. Professional sportswear campaign photo quality.`,
                },
              ],
            }),
          });

          if (imageResp.ok) {
            const imageData = await imageResp.json();
            const choice = imageData.choices?.[0]?.message;
            const imgUrl = extractImageFromResponse(choice as Record<string, unknown>);

            if (imgUrl) {
              console.log(`Got image for ${angle}`);
              return imgUrl;
            } else {
              console.warn(`No image in response for ${angle} (attempt ${attempts})`);
            }
          } else {
            const errText = await imageResp.text();
            console.error(`Image gen failed for ${angle}:`, imageResp.status, errText);
          }
        } catch (e) {
          console.error(`Image gen error for ${angle} (attempt ${attempts}):`, e);
        }
      }
      return null;
    }

    const angleResults = await Promise.all(angles.map(a => generateAngle(a)));
    const generatedImages: Record<string, string | null> = {};
    angles.forEach((a, i) => { generatedImages[a] = angleResults[i]; });

    // ── Step 4: Store results ──
    console.log("Step 4: Storing results...");

    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    let brandId = brand?.id;
    if (!brandId) {
      const { data: newBrand } = await supabase
        .from("brands")
        .insert({ owner_id: user.id, name: "My Brand" })
        .select("id")
        .single();
      brandId = newBrand?.id;
    }

    let projectId: string | null = null;
    if (brandId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("brand_id", brandId)
        .limit(1)
        .single();

      if (project) {
        projectId = project.id;
      } else {
        const { data: newProject } = await supabase
          .from("projects")
          .insert({ brand_id: brandId, name: "Default Project" })
          .select("id")
          .single();
        projectId = newProject?.id || null;
      }

      await supabase.from("usage_logs").insert({
        user_id: user.id,
        brand_id: brandId,
        action: "generate_motion",
        credits_used: 1,
        metadata: { movement, intensity, gender, size, bodyType, garmentName },
      });
    }

    // Upload generated images to storage
    const storedImageUrls: Record<string, string> = {};
    for (const [angle, imgData] of Object.entries(generatedImages)) {
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${angle}.png`;

          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("generated-images")
              .getPublicUrl(fileName);
            storedImageUrls[angle] = urlData.publicUrl;
          }
        } catch (e) {
          console.error(`Storage upload error for ${angle}:`, e);
        }
      }
    }

    const firstImageUrl = Object.values(storedImageUrls)[0] || null;

    if (brandId && projectId) {
      await supabase.from("assets").insert({
        brand_id: brandId,
        project_id: projectId,
        name: `${garmentName} - ${movement}`,
        type: "generated",
        status: "completed",
        thumbnail_url: firstImageUrl,
        physics_settings: physicsData,
        motion_settings: { movement, intensity },
        metadata: {
          garment_analysis: garmentAnalysis,
          athlete: { gender, size, bodyType },
          images: storedImageUrls,
          raw_images: {
            front: !!generatedImages.front,
            side: !!generatedImages.side,
            back: !!generatedImages.back,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        garment_analysis: garmentAnalysis,
        physics: physicsData,
        images: generatedImages,
        stored_urls: storedImageUrls,
        model_router: {
          analysis: MODEL_ROUTER.analyze,
          physics: MODEL_ROUTER.describe_physics,
          image_generation: MODEL_ROUTER.generate_image,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-motion error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message.includes("429") || message.includes("rate limit")) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
