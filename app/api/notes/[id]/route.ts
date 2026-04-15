import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { buildExcerpt } from "@/lib/note-helpers";
import { serializeNoteDetail } from "@/lib/serializers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        notebook: true,
      },
    });

    if (!note) {
      return errorResponse("Note not found.", 404);
    }

    return jsonResponse(serializeNoteDetail(note));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load note.";
    return errorResponse(message);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      notebookId?: string;
    };

    const title = body.title?.trim() || "Untitled note";
    const content = body.content ?? "";

    const note = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        excerpt: buildExcerpt(content, title),
        ...(body.notebookId ? { notebookId: body.notebookId } : {}),
      },
      include: {
        notebook: true,
      },
    });

    return jsonResponse(serializeNoteDetail(note));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note.";
    return errorResponse(message);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.note.delete({
      where: { id },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete note.";
    return errorResponse(message);
  }
}
