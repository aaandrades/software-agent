import { DynamicTool } from "langchain/tools";
// LangChain Tool: Get random Pokemon
const pokemonTool = new DynamicTool({
    name: "Get pokemon",
    description: "Fetches a random Pokemon",
    func: async () => {
        const randomNumber = Math.floor(Math.random() * 1000) + 1;
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomNumber}`);
        const pokemon = await res.json();
        return `Pokemon Name: ${pokemon.name}, ID: ${pokemon.id}, Height: ${pokemon.height}, Weight: ${pokemon.weight}`;
    },
});
export default pokemonTool;
