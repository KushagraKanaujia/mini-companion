import { promises as fs } from "fs";
import path from "path";

// Get list of available avatars
export async function GET() {
  try {
    const galleryPath = path.join(process.cwd(), "public/avatars/gallery.json");
    const fileContents = await fs.readFile(galleryPath, "utf8");
    const data = JSON.parse(fileContents);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error reading avatar gallery:", error);
    return new Response(
      JSON.stringify({ avatars: [] }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
