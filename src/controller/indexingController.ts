import { Request, Response } from "express";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import fs from "fs";
import path from "path";
import { glob } from "glob";

export const indexingController = async (req: Request, res: Response) => {
  const { repoPath } = req.body;
  if (!repoPath) {
    return res.status(400).json({ error: "repoPath is required" });
  }

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  const vectorStore = new Chroma(embeddings, {
    collectionName: "socket-collection",
    url: "http://localhost:8000",
    numDimensions: 1536,
  });

  const start = Date.now();

  try {
    // 1. Validate path
    if (!fs.existsSync(repoPath)) {
      return res
        .status(400)
        .json({ error: "Provided repoPath does not exist" });
    }

    // 2. Collect text/code files
    const files = glob.sync("**/*", {
      cwd: repoPath,
      nodir: true,
      ignore: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
        "**/*.pdf",
        "**/*.ico",
        "package-lock.json",
      ],
    });

    let docs: { pageContent: string; metadata: any }[] = [];
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    for (const file of files) {
      const filePath = path.join(repoPath, file);

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        if (!content.trim()) continue;

        const splits = await splitter.createDocuments(
          [content],
          [{ source: filePath }]
        );

        docs = docs.concat(splits);
      } catch {
        // Skip non-text files safely
        continue;
      }
    }

    console.log("Splitting whole codebase into: ", docs.length, " chunks");

    // 3. Store embeddings in Chroma
    await vectorStore.addDocuments(docs);

    const end = Date.now();
    const duration = (end - start) / 1000;

    res.json({
      message: "Indexing completed",
      repoPath,
      collection: "socket-collection",
      documents: docs.length,
      time_seconds: duration,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
