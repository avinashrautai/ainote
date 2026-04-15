import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { serializeNotebook } from "@/lib/serializers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      color?: string;
    };

    const name = body.name?.trim();

    if (!name) {
      return errorResponse("Notebook name is required.", 400);
    }

    const notebook = await prisma.notebook.create({
      data: {
        name,
        description: body.description?.trim() || null,
        color: body.color?.trim() || "#b85c38",
      },
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    });

    return jsonResponse(serializeNotebook(notebook), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create notebook.";
    return errorResponse(message);
  }
}
