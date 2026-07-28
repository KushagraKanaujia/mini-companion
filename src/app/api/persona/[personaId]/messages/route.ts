import { getRecentMessages } from "@/lib/companion";

export async function GET(_req: Request, { params }: { params: Promise<{ personaId: string }> }) {
  const { personaId } = await params;
  const messages = await getRecentMessages(personaId, 100);
  return Response.json({ messages });
}
