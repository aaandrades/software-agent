import { DynamicTool } from "langchain/tools";

const addTool = new DynamicTool({
  name: "add",
  description: "Add two numbers",
  func: async (input: string) => {
    const { a, b } = JSON.parse(input);
    return String(a + b);
  },
});

export default addTool;
