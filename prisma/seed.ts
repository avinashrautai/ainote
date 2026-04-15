import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.deleteMany();
  await prisma.notebook.deleteMany();

  const dailyNotes = await prisma.notebook.create({
    data: {
      name: "Daily Notes",
      description: "Quick captures, standups, and daily reflections.",
      color: "#b85c38",
    },
  });

  const research = await prisma.notebook.create({
    data: {
      name: "Research",
      description: "Long-form exploration and source notes.",
      color: "#236c4a",
    },
  });

  const productIdeas = await prisma.notebook.create({
    data: {
      name: "Product Ideas",
      description: "Feature concepts and experiments for the AI Notes App.",
      color: "#8b6f47",
    },
  });

  await prisma.note.create({
    data: {
      title: "Launch plan draft",
      excerpt: "Outline launch milestones and dependencies.",
      content:
        "Ship the polished notes workspace with reliable create, edit, search, filter, and autosave flows.\n\nConfirm the selected note always stays in sync with the right panel and that notebook context remains clear as people move through their work.",
      isPinned: true,
      notebookId: dailyNotes.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "Customer interview snippets",
      excerpt: "Capture themes from user calls and testing.",
      content:
        "Users want capture to feel instant. They also want to trust that edits are saved quickly and that it is always obvious which note they are working in.",
      notebookId: dailyNotes.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "Semantic retrieval ideas",
      excerpt: "Future ideas for AI-assisted search and synthesis.",
      content:
        "Potential future work: embeddings, note linking, retrieval scoring, and prompt-driven transformations.",
      notebookId: research.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "Inbox zero experiment",
      excerpt: "Ideas for taming note overload.",
      content:
        "Test notebook-level triage and focused note lists before adding more complex AI workflows.",
      notebookId: productIdeas.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
