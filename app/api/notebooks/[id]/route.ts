import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { serializeNotebook } from "@/lib/serializers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      color?: string;
    };

    const name = body.name?.trim();

    if (!name) {
      return errorResponse("Notebook name is required.", 400);
    }

    const notebook = await prisma.notebook.update({
      where: { id },
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

    return jsonResponse(serializeNotebook(notebook));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notebook.";
    return errorResponse(message);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.notebook.delete({
      where: { id },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete notebook.";
    return errorResponse(message);
  }
}
