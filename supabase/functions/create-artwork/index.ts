// supabase/functions/create-artwork/index.ts
import { serve } from "https://deno.land/std@0.218.2/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();

    const {
      image_path,
      title,
      author,
      description,
      category,
      lat,
      lng,
      location_text,
    } = body;

    if (!image_path || !title || !category || typeof lat !== "number" || typeof lng !== "number") {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const supabaseUrl = Deno.env.get("PROJECT_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? "";


    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) artworks
    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .insert([
        {
          image_path,
          title,
          author,
          description,
          category,
        },
      ])
      .select()
      .single();

    if (artworkError || !artwork) {
  console.error("artworkError", artworkError);
  return new Response(
    JSON.stringify({
      error: "Failed to create artwork",
      details: artworkError,
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}


    // 2) artwork_instances
    const { data: instance, error: instanceError } = await supabase
      .from("artwork_instances")
      .insert([
        {
          artwork_id: artwork.id,
          lat,
          lng,
          location_text,
        },
      ])
      .select()
      .single();

    if (instanceError || !instance) {
      console.error(instanceError);
      return new Response(JSON.stringify({ error: "Failed to create instance" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(
      JSON.stringify({
        artwork: {
          id: artwork.id,
          title: artwork.title,
          category: artwork.category,
        },
        instance: {
          id: instance.id,
          lat: instance.lat,
          lng: instance.lng,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
