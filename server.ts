import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

// Creates MCP server instance
const server = new McpServer({
  name: "software-agent",
  description: "A software agent that can perform various tasks",
  version: "1.0.0",
});

// Register a tool: Echo
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);

// Register a tool: API
server.registerTool(
  "Get a pokemon",
  {
    title: "Get a Pokemon",
    description: "Fetches a random Pokemon from the PokeAPI",
    inputSchema: {},
  },
  async () => {
    try {
      const randomNumber = Math.floor(Math.random() * 1000) + 1; // Random number between 1 and 1000
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${randomNumber}`
      );
      const pokemon = await response.json();
      return {
        content: [
          {
            type: "text",
            text: `Pokemon Name: ${pokemon.name}, ID: ${pokemon.id}, Height: ${pokemon.height}, Weight: ${pokemon.weight}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching Pokemon: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Register a tool: GitHub Create PR
// server.registerTool("github-create-pr",
//   {
//     title: "Create GitHub Pull Request",
//     description: "Creates a pull request in a given repository",
//     inputSchema: {
//       owner: z.string(),
//       repo: z.string(),
//       head: z.string(), // branch with your changes
//       base: z.string(), // branch you want to merge into
//       title: z.string(),
//       body: z.string().optional()
//     }
//   },
//   async ({ owner, repo, head, base, title, body }) => {
//     const token = process.env.GITHUB_TOKEN;
//     if (!token) {
//       return {
//         content: [{ type: "text", text: "Error: No GITHUB_TOKEN set in environment" }]
//       };
//     }

//     const octokit = new Octokit({ auth: token });

//     try {
//       const res = await octokit.pulls.create({
//         owner,
//         repo,
//         head,
//         base,
//         title,
//         body
//       });
//       return {
//         content: [{
//           type: "text",
//           text: `PR created: ${res.data.html_url}`
//         }]
//       };
//     } catch (err: any) {
//       return {
//         content: [{
//           type: "text",
//           text: `Failed to create PR: ${err.message}`
//         }]
//       };
//     }
//   }
// );

console.log("Starting MCP server 🤖");

// Connect MCP server to transport
const transport = new StdioServerTransport();
await server.connect(transport);
