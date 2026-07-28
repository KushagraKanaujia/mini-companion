import { getMemoryForDisplay } from "@/lib/companion";

export async function GET(_req: Request, { params }: { params: Promise<{ personaId: string }> }) {
  const { personaId } = await params;
  const data = await getMemoryForDisplay(personaId);
  return Response.json(data);
}
