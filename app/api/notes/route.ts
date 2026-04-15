import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { buildExcerpt } from "@/lib/note-helpers";
import { serializeNoteDetail } from "@/lib/serializers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      notebookId?: string;
      title?: string;
      content?: string;
    };

    let notebookId = body.notebookId;

    if (!notebookId) {
      const fallbackNotebook = await prisma.notebook.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

      notebookId = fallbackNotebook?.id;
    }

    if (!notebookId) {
      return errorResponse("Create a notebook before creating notes.", 400);
    }

    const title = body.title?.trim() || "Untitled note";
    const content = body.content ?? "";

    const note = await prisma.note.create({
      data: {
        title,
        content,
        excerpt: buildExcerpt(content, title),
        notebookId,
      },
      include: {
        notebook: true,
      },
    });

    return jsonResponse(serializeNoteDetail(note), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create note.";
    return errorResponse(message);
  }
}
