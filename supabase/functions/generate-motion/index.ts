import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Smart Model Router: picks optimal model per task
const MODEL_ROUTER: Record<string, string> = {
  analyze: "google/gemini-3-flash-preview",      // fast garment analysis
  generate_image: "google/gemini-3-pro-image-preview", // high-quality image gen
  describe_physics: "google/gemini-2.5-flash",    // physics text descriptions
};

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

    // Get user from JWT
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { garmentName, garmentBase64, gender, size, bodyType, movement, intensity, logoBase64 } = await req.json();

    // Step 1: Analyze garment (fast model)
    console.log("Step 1: Analyzing garment...");
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
            content: "You are an expert sportswear analyst. Analyze the garment image and return a brief JSON with: fabric_type, garment_category, color_palette (array of hex), stretch_rating (1-10), breathability_rating (1-10). Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: garmentBase64
              ? [
                  { type: "text", text: `Analyze this sportswear garment called "${garmentName}".` },
                  { type: "image_url", image_url: { url: garmentBase64 } },
                ]
              : `Analyze a sportswear garment called "${garmentName}". It's a typical activewear piece. Return analysis JSON.`,
          },
        ],
      }),
    });

    if (!analysisResp.ok) {
      const errText = await analysisResp.text();
      console.error("Analysis failed:", analysisResp.status, errText);
    }

    let garmentAnalysis = {};
    try {
      const analysisData = await analysisResp.json();
      const content = analysisData.choices?.[0]?.message?.content || "{}";
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) garmentAnalysis = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Analysis parse error:", e);
      garmentAnalysis = {
        fabric_type: "polyester-elastane blend",
        garment_category: "activewear",
        color_palette: ["#1a1a1a", "#00FF85"],
        stretch_rating: 8,
        breathability_rating: 7,
      };
    }

    // Step 2: Generate performance physics description
    console.log("Step 2: Generating physics description...");
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
            content: "You are a sportswear physics engine. Given garment details and movement, return JSON with: stretch_factor (e.g. '4x'), compression_percentage (0-100), sweat_absorption (0-100), breathability_score (0-100), stress_zones (array of strings), performance_notes (string, 1-2 sentences). Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: `Garment: ${JSON.stringify(garmentAnalysis)}. Athlete: ${gender}, size ${size}, ${bodyType} build. Movement: ${movement} at ${intensity}% intensity. Calculate realistic physics metrics.`,
          },
        ],
      }),
    });

    let physicsData = {
      stretch_factor: "4×",
      compression_percentage: 85,
      sweat_absorption: 92,
      breathability_score: 78,
      stress_zones: ["knees", "glutes", "waistband"],
      performance_notes: "Good stretch recovery under load. Compression zones maintain support during dynamic movement.",
    };

    try {
      const physicsJson = await physicsResp.json();
      const physContent = physicsJson.choices?.[0]?.message?.content || "{}";
      const jsonMatch = physContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) physicsData = { ...physicsData, ...JSON.parse(jsonMatch[0]) };
    } catch (e) {
      console.error("Physics parse error:", e);
    }

    // Step 3: Generate images using image model
    console.log("Step 3: Generating motion images...");
    const angles = ["front", "side", "back"];
    const generatedImages: Record<string, string | null> = {};

    for (const angle of angles) {
      try {
        const imageResp = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_ROUTER.generate_image,
            messages: [
              {
                role: "user",
                content: `Generate a professional studio photo of a ${gender} athlete (${bodyType} build, size ${size}) wearing activewear performing ${movement} at ${intensity}% intensity. ${angle} view angle. The garment should show realistic stretch, compression, and motion blur. Dark studio background with dramatic lighting. Professional sportswear campaign photo quality. Show realistic sweat and fabric tension. Athletic photography style similar to Nike or Adidas campaigns.`,
              },
            ],
          }),
        });

        if (imageResp.ok) {
          const imageData = await imageResp.json();
          const choice = imageData.choices?.[0]?.message;
          // Check for inline_data (base64 image) in parts
          if (choice?.content && Array.isArray(choice.content)) {
            for (const part of choice.content) {
              if (part.type === "image_url" && part.image_url?.url) {
                generatedImages[angle] = part.image_url.url;
                break;
              }
              if (part.inline_data) {
                generatedImages[angle] = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
                break;
              }
            }
          } else if (typeof choice?.content === "string") {
            // Text response - no image generated
            generatedImages[angle] = null;
          }
        } else {
          const errText = await imageResp.text();
          console.error(`Image gen failed for ${angle}:`, imageResp.status, errText);
          generatedImages[angle] = null;
        }
      } catch (e) {
        console.error(`Image gen error for ${angle}:`, e);
        generatedImages[angle] = null;
      }
    }

    // Step 4: Store assets in database
    console.log("Step 4: Storing results...");

    // Get or create brand for user
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

    // Get or create default project
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

      // Log usage
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        brand_id: brandId,
        action: "generate_motion",
        credits_used: 1,
        metadata: { movement, intensity, gender, size, bodyType, garmentName },
      });

      // Update credits
      await supabase
        .from("subscriptions")
        .update({ credits_used: supabase.rpc ? undefined : 1 })
        .eq("brand_id", brandId);
    }

    // Store generated images in storage
    const storedImageUrls: Record<string, string> = {};
    for (const [angle, imgData] of Object.entries(generatedImages)) {
      if (imgData && imgData.startsWith("data:")) {
        try {
          const base64Data = imgData.split(",")[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${user.id}/${Date.now()}_${angle}.png`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadError && uploadData) {
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

    // Create asset record
    if (brandId && projectId) {
      await supabase.from("assets").insert({
        brand_id: brandId,
        project_id: projectId,
        name: `${garmentName} - ${movement}`,
        type: "generated",
        status: "completed",
        physics_settings: physicsData,
        motion_settings: { movement, intensity },
        metadata: {
          garment_analysis: garmentAnalysis,
          athlete: { gender, size, bodyType },
          images: storedImageUrls,
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
      return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
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
