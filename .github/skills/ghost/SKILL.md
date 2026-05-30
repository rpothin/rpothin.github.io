---
name: ghost
description: "Your gateway to Ghostwriter writing agents for this blog. Lists available agents or activates one to shift the session into a specialized writing mode (interview, brainstorm, draft, review, etc.). Activate when the user mentions writing, blogging, drafting, or a specific agent by name."
---

# Ghostwriter Launcher

This skill is the entry point for the Ghostwriter writing agent system installed in this repo.
It delegates all logic to the `ghostwriter` and `ghostwriter_list` extension tools — this skill
is purely a discoverable shortcut so you can reach those tools via `/ghost` without needing to
remember their exact names.

## What to do when this skill is invoked

1. **If the user did not name a specific agent**, call `ghostwriter_list` immediately to show them
   the available agents, then ask which one they want to activate.

2. **If the user named an agent** (e.g. "interview", "writer", "review", "brainstorm", "voice",
   "context", "product-moral-compass"), call `ghostwriter` with that agent key right away —
   do not ask for confirmation first.

3. **After activating an agent**, briefly confirm which agent is now active and what it does,
   then follow its instructions for the rest of the session.

## Available agents (for reference)

These are the typical agents, but always call `ghostwriter_list` for the live list since agents
are discovered at runtime from the local environment:

| Key                     | Purpose                                                      |
|-------------------------|--------------------------------------------------------------|
| `interview`             | Interviews the author to surface ideas and produce a draft   |
| `writer`                | Writes comprehensive, well-cited content from a draft        |
| `brainstorm`            | Facilitates open-ended ideation and generates action plans   |
| `review`                | Reviews content against editorial guidelines                 |
| `voice`                 | Analyzes writing style to replicate the author's voice       |
| `context`               | Loads current work-in-progress content into context          |
| `product-moral-compass` | Guides thoughtful build-vs-buy decisions before coding       |

## Important behavior notes

- **Activation is session-scoped** — the agent switch applies only to this session. Open a new
  session to start fresh.
- **Stacking agents is cumulative** — calling `ghostwriter` multiple times in one session injects
  context additively. For a clean persona switch, open a new session.
- **Agents are installed locally** — if `ghostwriter_list` returns nothing, direct the user to
  run `npx @estruyf/ghostwriter --copilot` to install them.
