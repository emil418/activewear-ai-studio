import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { gender, skin_tone, face_structure, hair_style, hair_color, body_type, brand_vibe, count = 4 } = body;

    const genderDesc = (gender || "male").toLowerCase();
    const skinDesc = skin_tone || "medium";
    const faceDesc = face_structure || "angular";
    const hairDesc = hair_style || "short fade";
    const hairColorDesc = hair_color || "black";
    const vibeDesc = brand_vibe || "aesthetic";

    const basePrompt = `Professional headshot portrait photo of a ${genderDesc} athlete with ${skinDesc} skin tone, ${faceDesc} face structure, ${hairDesc} ${hairColorDesc} hair. Athletic ${body_type || "aesthetic"} build. ${vibeDesc} brand vibe. Clean studio lighting, neutral gray background, sharp focus on face, shoulders visible. Photorealistic, high resolution, no text, no watermark, no artifacts, no glow or halo around the subject.`;

    const variations = [
      `${basePrompt} Direct eye contact, confident neutral expression.`,
      `${basePrompt} Slight smile, warm expression, approachable look.`,
      `${basePrompt} Intense focused expression, competitive athlete look.`,
      `${basePrompt} Relaxed natural expression, casual confidence.`,
    ];

    const selectedVariations = variations.slice(0, Math.min(count, 4));

    const results: string[] = [];

    for (const prompt of selectedVariations) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          console.error("AI generation failed:", aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          // Upload to storage
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const fileName = `faces/${user.id}/${crypto.randomUUID()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: false });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          const { data: publicUrl } = supabase.storage
            .from("generated-images")
            .getPublicUrl(fileName);

          results.push(publicUrl.publicUrl);
        }
      } catch (err) {
        console.error("Face generation error:", err);
      }
    }

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to generate faces" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ faces: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
