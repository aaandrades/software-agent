import { Request, Response } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { codebaseKnowledgeTool } from "../tools/repoKnowledge";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

// 1. Model changed as requested
const agentModel = new ChatOpenAI({ model: "gpt-5-nano" });
const agentCheckpointer = new MemorySaver();
const agent = createReactAgent({
  llm: agentModel,
  tools: [codebaseKnowledgeTool],
  checkpointSaver: agentCheckpointer,
});

export const langController = async (req: Request, res: Response) => {
  const { text, thread_id } = req.body;

  console.log("RECEIGING: ", text)
  if (!text || !thread_id) {
    return res
      .status(400)
      .json({ error: "Both 'text' and 'thread_id' are required." });
  }

  try {
    // 2. Reverted from .stream() back to .invoke()
    const response = await agent.invoke(
      { messages: [new HumanMessage(text)] },
      { configurable: { thread_id } }
    );

    console.log('Response from model: ', response);
    // 3. Parse the final response object to extract the content
    const finalContent = response.messages[1].content || "";
    console.log("====");
    console.log(finalContent);
    console.log("====");

    if (finalContent) {
      res.status(200).json({ response: finalContent });
    } else {
      console.error(
        "Could not extract final content from agent response:",
        response
      );
      res
        .status(500)
        .json({ error: "Failed to get a valid response from the agent." });
    }
  } catch (error) {
    console.error(`[${thread_id}] CRITICAL ERROR in agent invocation:`, error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
};
