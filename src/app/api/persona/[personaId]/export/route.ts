import { exportPersonaData } from "@/lib/companion";

export async function GET(_req: Request, { params }: { params: Promise<{ personaId: string }> }) {
  const { personaId } = await params;
  const data = await exportPersonaData(personaId);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="companion-export-${personaId}.json"`,
    },
  });
}
