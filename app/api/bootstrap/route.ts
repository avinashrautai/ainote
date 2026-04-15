import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { serializeNoteListItem, serializeNotebook } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get("notebookId");
    const query = searchParams.get("q")?.trim();

    const notebooks = await prisma.notebook.findMany({
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const notes = await prisma.note.findMany({
      where: {
        ...(notebookId ? { notebookId } : {}),
        ...(query
          ? {
              OR: [
                {
                  title: {
                    contains: query,
                  },
                },
                {
                  content: {
                    contains: query,
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        notebook: true,
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return jsonResponse({
      notebooks: notebooks.map(serializeNotebook),
      notes: notes.map(serializeNoteListItem),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    return errorResponse(message);
  }
}
