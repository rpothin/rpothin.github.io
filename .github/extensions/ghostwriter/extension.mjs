/**
 * Ghostwriter Extension Bridge
 * =============================
 * This Copilot app extension bridges the ghostwriter-agents-ai collection
 * (https://github.com/estruyf/ghostwriter-agents-ai) into any session in
 * this repo.
 *
 * HOW IT WORKS
 * ------------
 * 1. At startup, the extension scans ~/.copilot/agents/ for any file ending
 *    in ".ghostwriter.md". Each file is a self-contained writing agent with
 *    YAML frontmatter (name, description, version) followed by its full
 *    system-prompt instructions.
 *
 * 2. Two tools are registered and made available to the LLM in every session:
 *
 *    - ghostwriter_list : returns a formatted list of discovered agents so
 *      the user (or the LLM) can see what's available without leaving the chat.
 *
 *    - ghostwriter : activates a specific agent by key (e.g. "interview",
 *      "writer"). It strips the frontmatter and returns the raw instructions
 *      as the tool result. Because tool results are injected back into the
 *      conversation context, this effectively reprograms the LLM's behavior
 *      for the remainder of the session.
 *
 * 3. An onSessionStart hook fires whenever a new session opens. If agents are
 *    installed it injects a one-line hint into the session's additionalContext
 *    so the LLM already knows the tools exist without being explicitly asked.
 *
 * PREREQUISITES
 * -------------
 * Install the Ghostwriter agents once on your machine:
 *   npx @estruyf/ghostwriter --copilot
 *
 * This drops markdown files into ~/.copilot/agents/ which this extension
 * then picks up automatically on the next session start.
 *
 * AGENT FILE FORMAT
 * -----------------
 * ---
 * name: "Ghostwriter Interviewer"
 * description: "Interviews an author to produce content..."
 * version: "2.2.0"
 * ---
 *
 * Act as an expert interviewer...
 */

import { joinSession } from "@github/copilot-sdk/extension";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Agents are installed by `npx @estruyf/ghostwriter --copilot` into this directory.
const agentsDir = join(homedir(), ".copilot", "agents");

// Parse a single agent file: extract name/description from YAML frontmatter
// and the raw instructions from the body (everything after the closing ---).
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
    // Strip the frontmatter block to get only the instruction text.
    const instructions = raw.replace(/^---[\s\S]*?---\n/, "").trim();
    return { name, description, instructions, filename };
}

// Load all *.ghostwriter.md files from the agents directory.
// Returns an empty array if the directory doesn't exist (agents not installed).
function loadAllAgents() {
    if (!existsSync(agentsDir)) return [];
    return readdirSync(agentsDir)
        .filter(f => f.endsWith(".ghostwriter.md"))
        .map(parseAgent);
}

// Derive the short key used to identify/activate an agent (e.g. "interview").
function getAgentKey(filename) {
    return filename.replace(".ghostwriter.md", "");
}

// Discover agents once at startup. The list is static for the lifetime of the
// extension process — restart the session to pick up newly installed agents.
const agents = loadAllAgents();
const agentKeys = agents.map(a => getAgentKey(a.filename));

// joinSession registers this extension with the Copilot app runtime and keeps
// the process alive, handling JSON-RPC communication on stdin/stdout.
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
                // Returning the instructions as the tool result injects them into
                // the conversation context, which reprograms the LLM's behavior.
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
        // Inject a context hint at the start of every session so the LLM is
        // aware that Ghostwriter tools exist without the user having to ask.
        onSessionStart: async () => {
            if (agents.length === 0) return {};
            return {
                additionalContext: `Ghostwriter writing agents are available in this session. Call \`ghostwriter_list\` to see them, or call \`ghostwriter\` with an agent key (e.g. "interview", "writer", "review") to activate one and switch the agent's behavior.`,
            };
        },
    },
});

await session.log("Ghostwriter extension loaded — " + (agents.length > 0 ? `${agents.length} agents available` : "no agents found (run: npx @estruyf/ghostwriter --copilot)"));
