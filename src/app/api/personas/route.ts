import { supabaseAdmin } from "@/lib/supabase";

// Create a new persona
export async function POST(req: Request) {
  try {
    const { user_id, name, personality, face_url, voice_id } = await req.json();

    if (!user_id || !name || !personality) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, name, personality" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("personas")
      .insert({
        user_id,
        name,
        personality,
        face_url: face_url || null,
        voice_id: voice_id || null,
      })
      .select("id, name, personality, face_url, voice_id")
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create persona" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating persona:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// List all personas for a user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Missing user_id parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("personas")
    .select("id, name, personality, face_url, voice_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch personas" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ personas: data }), {
    headers: { "Content-Type": "application/json" },
  });
}
