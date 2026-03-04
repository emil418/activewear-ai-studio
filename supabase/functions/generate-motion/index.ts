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

    const { garmentName, garmentBase64, gender, size, bodyType, movement, intensity, logoBase64, logoPosition, athleteIdentity, videoMode } = await req.json();
    // logoPosition: { x: number, y: number, placement: string } | undefined
    // athleteIdentity: { name, gender, height_cm, weight_kg, body_type, muscle_density, body_fat_pct, skin_tone, face_structure, hair_style, brand_vibe, identity_seed } | undefined
    // videoMode: boolean | undefined — if true, generate sequential motion frames instead of multi-angle

    // ── VIDEO MODE: Generate sequential motion frames ──
    if (videoMode) {
      console.log("VIDEO MODE: Generating motion frame sequence...");
      const FRAME_COUNT = 5;
      const framePhases = [
        { phase: "starting position", tension: "relaxed", fabric: "resting naturally" },
        { phase: "beginning of movement", tension: "slight engagement", fabric: "starting to stretch" },
        { phase: "peak of movement", tension: "maximum contraction", fabric: "maximum stretch and compression" },
        { phase: "eccentric return", tension: "controlled release", fabric: "returning with slight bounce" },
        { phase: "end position / reset", tension: "settling", fabric: "settling back to rest" },
      ];

      const athleteLabel = athleteIdentity
        ? `${athleteIdentity.gender} athlete (${athleteIdentity.body_type} build, ${athleteIdentity.height_cm}cm, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style} hair)`
        : `${gender} athlete (${bodyType}, size ${size})`;

      const frameUrls: string[] = [];

      for (let i = 0; i < FRAME_COUNT; i++) {
        const { phase, tension, fabric } = framePhases[i];
        console.log(`Generating video frame ${i + 1}/${FRAME_COUNT}: ${phase}`);

        const framePrompt = `Professional full-body studio photo for a motion sequence frame ${i + 1} of ${FRAME_COUNT}.

ATHLETE: ${athleteLabel}
GARMENT: Wearing the uploaded activewear garment.
MOVEMENT: ${movement} at ${intensity}% intensity
PHASE: ${phase}
MUSCLE STATE: ${tension}
FABRIC STATE: ${fabric}

CRITICAL REQUIREMENTS:
- FRONT camera angle, FULL BODY from head to toe
- This is frame ${i + 1} of a ${FRAME_COUNT}-frame motion sequence — the pose must clearly show the "${phase}" stage of ${movement}
- Maintain IDENTICAL athlete identity across all frames (same face, body, skin, hair)
- Garment must show realistic fabric response: ${fabric}
- Subtle muscle definition changes reflecting ${tension}
- Dark studio background, professional sportswear campaign lighting
- 9:16 vertical portrait format (Reels-ready)
- NO text, NO watermarks, NO UI elements`;

        const contentParts: Array<Record<string, unknown>> = [
          { type: "text", text: framePrompt },
        ];

        // Use the garmentBase64 if it's a data URL, otherwise just the text prompt
        if (garmentBase64 && garmentBase64.startsWith("data:")) {
          contentParts.push({ type: "image_url", image_url: { url: garmentBase64 } });
        }

        let frameUrl: string | null = null;
        let attempts = 0;
        while (attempts < 3 && !frameUrl) {
          attempts++;
          try {
            const resp = await fetch(AI_GATEWAY, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: MODEL_ROUTER.generate_image,
                modalities: ["image", "text"],
                messages: [{ role: "user", content: contentParts }],
              }),
            });

            if (resp.ok) {
              const data = await resp.json();
              frameUrl = extractImageFromResponse(data.choices?.[0]?.message);
            }
          } catch (e) {
            console.error(`Frame ${i + 1} attempt ${attempts} error:`, e);
          }
          if (!frameUrl && attempts < 3) await new Promise(r => setTimeout(r, 1500));
        }

        // Store frame to storage
        if (frameUrl && frameUrl.startsWith("data:")) {
          try {
            const base64Data = frameUrl.split(",")[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `${user.id}/video_${Date.now()}_frame_${i}.png`;
            const { error: uploadError } = await supabase.storage
              .from("generated-images")
              .upload(fileName, binaryData, { contentType: "image/png", upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
              frameUrls.push(urlData.publicUrl);
            }
          } catch (e) {
            console.error(`Frame ${i + 1} storage error:`, e);
          }
        } else if (frameUrl) {
          frameUrls.push(frameUrl);
        }

        // Delay between frames
        if (i < FRAME_COUNT - 1) await new Promise(r => setTimeout(r, 1000));
      }

      // Log usage
      const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).limit(1).single();
      if (brand) {
        await supabase.from("usage_logs").insert({
          user_id: user.id,
          brand_id: brand.id,
          action: "generate_video_frames",
          credits_used: 2,
          metadata: { movement, intensity, gender, size, bodyType, frame_count: frameUrls.length },
        });
      }

      console.log(`VIDEO MODE complete: ${frameUrls.length}/${FRAME_COUNT} frames generated`);

      return new Response(
        JSON.stringify({
          success: true,
          video_mode: true,
          frame_count: frameUrls.length,
          frame_urls: frameUrls,
          movement,
          phases: framePhases.map(p => p.phase),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

          // On later retries, use a simpler prompt to increase success rate
          const useSimplePrompt = attempts >= 2;

          const placementLabel = logoPosition?.placement || "chest-center";
          const isFrontPlacement = placementLabel.startsWith("chest") || placementLabel === "belly-center" || placementLabel === "upper" || placementLabel === "middle";
          const isBackPlacement = placementLabel.startsWith("back");
          const isSleevePlacement = placementLabel.startsWith("sleeve");

          // Determine if logo should be visible in this angle
          const showLogoThisAngle =
            (angle === "front" && isFrontPlacement) ||
            (angle === "back" && isBackPlacement) ||
            (angle === "side" && isSleevePlacement);

          const logoInstructions = processedLogo ? (showLogoThisAngle
            ? `
LOGO PLACEMENT (CRITICAL):
- The brand logo is placed at "${placementLabel}" on the garment.
- This is the ${angle} view, so the logo IS visible.
- BLEND the logo INTO the fabric naturally: it should look like a real screen-print or heat-transfer on the fabric.
- The logo must follow the fabric's texture, wrinkles, stretch, and lighting — NOT look pasted/floating on top.
- Keep the logo at a NATURAL proportional size (roughly 8-12cm on a real garment, small relative to the chest area).
- Preserve the logo's EXACT original colors — no tinting, no recoloring, no bleeding.
- Add subtle fabric texture showing through the logo (like a real print).
- If the garment is stretching during motion, the logo should distort slightly with the fabric.
- Do NOT duplicate the logo anywhere else on the garment.`
            : `
LOGO VISIBILITY (CRITICAL):
- The brand logo is placed at "${placementLabel}" which is on the ${isFrontPlacement ? "front" : isBackPlacement ? "back" : "sleeve"} of the garment.
- This is the ${angle} view — the logo is NOT visible from this angle.
- Do NOT show any logo, text, emblem, or branding on this view.
- The garment on this side must be completely plain/blank with no markings.`) : "";

          const FRAMING = `FRAMING (CRITICAL): Show the COMPLETE athlete from head to toe in every shot. Full-body framing — never crop at the waist or torso. The entire figure, including feet and head, must be visible. Consistent framing across all angles.`;

          // Anti-duplication instructions for back/side views
          const MOTIF_RULES = angle === "front"
            ? `EXISTING MOTIFS: The uploaded garment reference image shows the FRONT of the garment. Any prints, motifs, graphics, or text visible in the reference are part of the FRONT ONLY. Reproduce them faithfully in this front view exactly as they appear in the reference — same position, size, colors, and style.`
            : `MOTIF DUPLICATION BAN (CRITICAL): The uploaded garment reference image shows the FRONT of the garment. Any prints, motifs, graphics, logos, or text visible in that reference are on the FRONT ONLY. This is the ${angle.toUpperCase()} view — you MUST NOT copy, mirror, duplicate, or reproduce ANY front-side prints/motifs/graphics onto the ${angle}. The ${angle} of this garment is COMPLETELY PLAIN with NO prints, NO text, NO graphics, NO logos — just solid fabric matching the base color of the garment. Do NOT hallucinate or invent any design on the ${angle}.`;

          // Build athlete description
          const athleteDesc = athleteIdentity
            ? `ATHLETE IDENTITY (CRITICAL — MUST be consistent across ALL angles and sizes):
- Name/Seed: "${athleteIdentity.name}" (identity_seed: ${athleteIdentity.identity_seed || 'N/A'})
- Gender: ${athleteIdentity.gender}
- Height: ${athleteIdentity.height_cm}cm, Weight: ${athleteIdentity.weight_kg}kg
- Body Type: ${athleteIdentity.body_type}, Muscle Density: ${athleteIdentity.muscle_density}/10, Body Fat: ${athleteIdentity.body_fat_pct}%
- Skin Tone: ${athleteIdentity.skin_tone}
- Face Structure: ${athleteIdentity.face_structure}
- Hair Style: ${athleteIdentity.hair_style}
- Brand Vibe: ${athleteIdentity.brand_vibe}
You MUST render this EXACT same person in every image. Same face, same body proportions, same skin tone, same hair. No variations allowed. This is a persistent brand athlete — consistency is paramount.`
            : "";

          const athleteLabel = athleteIdentity
            ? `${athleteIdentity.gender} athlete named "${athleteIdentity.name}" (${athleteIdentity.body_type} build, ${athleteIdentity.height_cm}cm, ${athleteIdentity.weight_kg}kg, ${athleteIdentity.skin_tone} skin, ${athleteIdentity.face_structure} face, ${athleteIdentity.hair_style} hair, muscle density ${athleteIdentity.muscle_density}/10, body fat ${athleteIdentity.body_fat_pct}%)`
            : `${gender} athlete (${bodyType}, size ${size})`;

          // Build the prompt
          const mainPrompt = useSimplePrompt
            ? `Professional full-body studio photo: ${athleteLabel} wearing this exact uploaded garment, performing ${movement}, ${angle} camera angle. FULL BODY head-to-toe framing — show entire figure including feet. Dark background, sportswear campaign photography. ${athleteDesc} ${MOTIF_RULES}${logoInstructions}`
            : `CRITICAL INSTRUCTIONS:
1. GARMENT REFERENCE: The uploaded garment image is the EXACT and ONLY reference. Preserve its exact color, fabric texture, seams, and details with 100% fidelity. Do NOT invent, add, or duplicate any prints, motifs, logos, or graphics that are not in the reference.
2. ${MOTIF_RULES}
3. CAMERA ANGLE: This is a ${angle.toUpperCase()} view — render the garment from the ${angle} perspective.
4. ${FRAMING}
${athleteDesc ? `5. ${athleteDesc}` : ""}

Generate a professional FULL-BODY studio photo of ${athleteLabel}, size ${size}, wearing EXACTLY this uploaded garment while performing ${movement} at ${intensity}% intensity.

Requirements:
- ${angle.toUpperCase()} camera angle
- FULL-BODY framing: head to toe visible, never cropped at waist or chest
- Garment color and fabric must match uploaded reference EXACTLY — no color shifting
- ${angle !== "front" ? `The ${angle} of the garment must be COMPLETELY PLAIN — no prints, motifs, text, or graphics from the front` : "Faithfully reproduce any existing prints/motifs from the reference"}
- Realistic stretch, compression, and motion physics for ${movement}
- Dark studio background with dramatic lighting
- Professional sportswear campaign quality (Nike/Adidas level)
- The garment is the HERO of the image
${athleteIdentity ? `- The athlete must look EXACTLY like the described identity — same face, skin, hair, proportions in every image` : ""}
${logoInstructions}`;

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
                        { type: "text", text: mainPrompt },
                        { type: "image_url", image_url: { url: processedGarment } },
                        // Only include logo image reference when it should be visible in this angle
                        ...(processedLogo && showLogoThisAngle ? [{ type: "image_url", image_url: { url: processedLogo } }] : []),
                      ]
                    : `Studio photo: ${gender} athlete (${bodyType}, size ${size}) wearing dark athletic activewear performing ${movement} at ${intensity}% intensity. ${angle} view. Dark background, professional sportswear photography.`,
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

          // Small delay before retry to avoid rate limiting
          if (attempts < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch (e) {
          console.error(`Image gen error for ${angle} (attempt ${attempts}):`, e);
        }
      }
      return null;
    }

    // Generate angles sequentially to avoid rate-limit issues
    const angleResults: (string | null)[] = [];
    for (const angle of angles) {
      const result = await generateAngle(angle);
      angleResults.push(result);
    }
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
