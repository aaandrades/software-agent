import { Request, Response } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const agentModel = new ChatOpenAI({ model: "gpt-5" });

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore = new Chroma(embeddings, {
  collectionName: "socket-collection",
  url: "http://localhost:8000",
  numDimensions: 1536,
});

// Simple in-memory storage (lost on server restart)
const threadHistories: Record<
  string,
  { role: "system" | "user" | "assistant"; content: string }[]
> = {};

export const langController = async (req: Request, res: Response) => {
  const { text, thread_id, jiraDescription } = req.body;

  if (!text || !thread_id) {
    return res
      .status(400)
      .json({ error: "Both 'text' and 'thread_id' are required." });
  }

  console.log(`[${thread_id}] Query:`, text);

  try {
    // 🔎 Retrieve context for this query
    const retrievedDocs = await vectorStore.similaritySearch(
      text + (jiraDescription || "")
    );
    const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n");

    if (!threadHistories[thread_id]) {
      threadHistories[thread_id] = [
        {
          role: "system",
          content: `
          You are a highly specialized software engineering AI agent with strict operational protocols for handling technical interactions. Your primary objective is to provide precise, context-aware responses to software development queries.

          ### Core Operational Guidelines

          ### Response Handling
          * Always base your responses on the provided context
          * Maintain a professional and concise communication style
          * Respond in a specific format where the first part constains the answer in Markdown and then the code changes will be wrapped in a word "codeChanges" followed by an array of objects with "path" and "content" keys
          * Do not reference or mention that the answer is based on the snippets or context provided. Only provide the answer directly.
          * Never send additional information after "codeChanges" array

          ### Context Processing
          * If context is insufficient to answer a query, explicitly state "I don't have enough information to answer"
          * For code-related requests, generate modifications with explicit file paths

          ### Interaction Protocols
          * For questions: Provide a direct answer followed by a clarifying follow-up
          * For implementation requests: Return code changes in an array of objects
          * For Jira ticket analysis: Deliver a concise 4-paragraph technical assessment
          * Avoid unnecessary technical jargon
          * Prioritize clarity and actionable insights
          * Do not create or implement codeChanges unless the user explicitly requests it, for example: Implement ABC changes, create a XYZ component, etc.


          ### User input
          * Question: User prompt
          * Context: Embedded context from retrieval
          * Jira ticket: Optional Jira ticket description for context

          ### Response Structure
          """
            [RESPONSE DESCRIPTION]

            codeChanges: [
              {
                "path": "[FILE PATH]",
                "content": "[NEW CODE CONTENT]"
              }
            ]
          """

          ### Interaction Readiness
          You are now prepared to receive technical queries, context, and instructions with a systematic and precise approach to software engineering problem-solving.
          `,
        },
      ];
    }

    // Push the current user question, with retrieved context included
    threadHistories[thread_id].push({
      role: "user",
      content: `Question: ${text}\n\nContext:\n${docsContent} \n\nJira ticket:\n${jiraDescription} `,
    });

    // Call model with the whole history - Static full response
    // ----------------------****-------------------------
    // const answer = await agentModel.invoke(threadHistories[thread_id], {
    //   configurable: { thread_id },
    // });
  
    // threadHistories[thread_id].push({
    //   role: "assistant",
    //   content: String(answer.content),
    // });
  
    // console.log(`[${thread_id}] Response:`, answer.content);
    // return res.status(200).json({ messages: answer.content });
    // ----------------------****-------------------------

    // Call model with the whole history - Streaming
    // res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");

    const stream = await agentModel.stream(threadHistories[thread_id]);

    const chunks = [];
    let message: any = "";

    console.log("Streaming started");

    for await (const chunk of stream) {
      chunks.push(chunk);
      message += chunk.content;
      res.write(chunk.content);
    }
    threadHistories[thread_id].push({
      role: "assistant",
      content: message,
    });

    console.log("Streaming finished: ", message);
    res.end();
  } catch (error) {
    console.error(`[${thread_id}] CRITICAL ERROR:`, error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "An error occurred while processing the response." });
    }
  }
};
