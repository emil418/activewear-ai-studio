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
    const {
      gender, skin_tone, face_structure, hair_style, hair_color,
      body_type, brand_vibe, appearance_preset, face_style,
      age_feel, expression_style, hair_type, hair_length, count = 4,
    } = body;

    const genderDesc = (gender || "male").toLowerCase();
    const skinDesc = skin_tone || "medium";
    const faceDesc = face_structure || "angular";
    const hairStyleDesc = hair_style || "short fade";
    const hairColorDesc = hair_color || "black";
    const hairTypeDesc = hair_type || "straight";
    const hairLengthDesc = hair_length || "short";
    const vibeDesc = brand_vibe || "aesthetic";
    const presetDesc = appearance_preset && appearance_preset !== "Custom" ? `, ${appearance_preset} appearance` : "";
    const faceStyleDesc = face_style ? `, ${face_style.toLowerCase()} facial aesthetic` : "";
    const ageDesc = age_feel || "athletic adult";

    const basePrompt = `Professional headshot portrait photo of a ${genderDesc} ${ageDesc} athlete${presetDesc}${faceStyleDesc}. ${skinDesc} skin tone, ${faceDesc} face structure, ${hairLengthDesc} ${hairTypeDesc} ${hairStyleDesc} ${hairColorDesc} hair. Athletic ${body_type || "aesthetic"} build. ${vibeDesc} brand vibe. Clean studio lighting, neutral gray background, sharp focus on face, shoulders visible. Photorealistic, high resolution, no text, no watermark, no artifacts, no glow or halo around the subject.`;

    const expressionVariations = [
      { expr: expression_style || "confident neutral", label: "Confident" },
      { expr: "slight smile, warm expression, approachable look", label: "Warm" },
      { expr: "intense focused expression, competitive athlete look", label: "Intense" },
      { expr: "relaxed natural expression, casual confidence", label: "Relaxed" },
    ];

    const selectedVariations = expressionVariations.slice(0, Math.min(count, 4));
    const results: string[] = [];

    for (const variation of selectedVariations) {
      try {
        const prompt = `${basePrompt} ${variation.expr}.`;
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("AI generation failed:", aiResponse.status, errText);
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
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
      return new Response(JSON.stringify({ error: "Failed to generate faces. Please try again." }), {
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
