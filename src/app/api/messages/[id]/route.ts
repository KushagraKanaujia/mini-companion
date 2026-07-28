import { editMessage, deleteMessage } from "@/lib/companion";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return new Response("Missing content", { status: 400 });
  await editMessage(id, content);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteMessage(id);
  return Response.json({ ok: true });
}
