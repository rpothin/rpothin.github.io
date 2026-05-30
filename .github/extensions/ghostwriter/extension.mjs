import { joinSession } from "@github/copilot-sdk/extension";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const agentsDir = join(homedir(), ".copilot", "agents");

function parseAgent(filename) {
    const filePath = join(agentsDir, filename);
    const raw = readFileSync(filePath, "utf-8");
    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
    let name = filename.replace(".ghostwriter.md", "");
    let description = "";
    if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        const nameMatch = fm.match(/^name:\s*"(.+)"/m);
        const descMatch = fm.match(/^description:\s*"(.+)"/m);
        if (nameMatch) name = nameMatch[1];
        if (descMatch) description = descMatch[1];
    }
    const instructions = raw.replace(/^---[\s\S]*?---\n/, "").trim();
    return { name, description, instructions, filename };
}

function loadAllAgents() {
    if (!existsSync(agentsDir)) return [];
    return readdirSync(agentsDir)
        .filter(f => f.endsWith(".ghostwriter.md"))
        .map(parseAgent);
}

function getAgentKey(filename) {
    return filename.replace(".ghostwriter.md", "");
}

const agents = loadAllAgents();
const agentKeys = agents.map(a => getAgentKey(a.filename));

const session = await joinSession({
    tools: [
        {
            name: "ghostwriter",
            description: "Activate a Ghostwriter writing agent. Call this to switch the agent's persona and operating instructions for the session. Available agents: " + (agentKeys.length > 0 ? agentKeys.join(", ") : "none installed — run: npx @estruyf/ghostwriter --copilot"),
            parameters: {
                type: "object",
                properties: {
                    agent: {
                        type: "string",
                        description: "The agent key to activate (e.g. 'interview', 'writer', 'review')",
                        ...(agentKeys.length > 0 ? { enum: agentKeys } : {}),
                    },
                },
                required: ["agent"],
            },
            handler: async (args) => {
                const found = agents.find(a => getAgentKey(a.filename) === args.agent);
                if (!found) {
                    return `Agent "${args.agent}" not found.\n\nAvailable: ${agentKeys.join(", ")}\n\nIf empty, run: npx @estruyf/ghostwriter --copilot`;
                }
                return `[Ghostwriter: "${found.name}" activated]\n\n${found.instructions}`;
            },
        },
        {
            name: "ghostwriter_list",
            description: "List all available Ghostwriter agents with their names and descriptions.",
            parameters: { type: "object", properties: {} },
            handler: async () => {
                if (agents.length === 0) {
                    return "No Ghostwriter agents installed.\n\nInstall them with:\n  npx @estruyf/ghostwriter --copilot";
                }
                const lines = agents.map(a => `• ${getAgentKey(a.filename)} — ${a.name}: ${a.description}`);
                return `Ghostwriter agents available:\n\n${lines.join("\n")}`;
            },
        },
    ],
    hooks: {
        onSessionStart: async () => {
            if (agents.length === 0) return {};
            return {
                additionalContext: `Ghostwriter writing agents are available in this session. Call \`ghostwriter_list\` to see them, or call \`ghostwriter\` with an agent key (e.g. "interview", "writer", "review") to activate one and switch the agent's behavior.`,
            };
        },
    },
});

await session.log("Ghostwriter extension loaded — " + (agents.length > 0 ? `${agents.length} agents available` : "no agents found (run: npx @estruyf/ghostwriter --copilot)"));
