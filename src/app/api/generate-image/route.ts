// AI image generation using Replicate (Stable Diffusion)
export async function POST(req: Request) {
  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Replicate API key not configured. Add REPLICATE_API_KEY to .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Using Stable Diffusion XL for high-quality portrait generation
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
        input: {
          prompt: `${prompt}, portrait, high quality, professional, friendly face`,
          negative_prompt: "ugly, blurry, low quality, distorted",
          width: 512,
          height: 512,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();

    // Poll for completion (Replicate is async)
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      result = await pollResponse.json();
    }

    if (result.status === "failed") {
      throw new Error("Image generation failed");
    }

    return new Response(
      JSON.stringify({ image_url: result.output[0] }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate image" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
