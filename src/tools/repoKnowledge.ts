import { tool } from "@langchain/core/tools";
import { z } from "zod";

const codebaseKnowledgeTool = tool(
  async (input) => {
    return `Hey user!  ${input}`;
  },
  {
    name: "echo_tool",
    description: "Repeats the same as the user plus a greeting",
    schema: {},
  }
);

export { codebaseKnowledgeTool };
