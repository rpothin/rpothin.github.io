import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { fromHighlighter } from "@shikijs/markdown-it/core";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import lunr from "lunr";

const CONTENT_DIR = path.resolve("content");
const PUBLIC_DIR = path.resolve("public");
const OUTPUT_CONTENT_DIR = path.join(PUBLIC_DIR, "content");

const RSS_OUTPUT_PATH = path.join(PUBLIC_DIR, "rss.xml");
const RSS_ITEM_LIMIT = 20;
const DEFAULT_SITE_URL = "https://rpothin.github.io";

function readDotEnvValue(key: string): string | null {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const k = match[1];
    if (k !== key) continue;
    let v = match[2] ?? "";
    // strip surrounding quotes
    v = v.replace(/^\s*['"]/, "").replace(/['"]\s*$/, "");
    return v.trim();
  }
  return null;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

interface DocEntry {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSiteUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  return trimmed;
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssPubDate(yyyyMmDd: string): string | null {
  const value = (yyyyMmDd || "").trim();
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toUTCString();
}

function truncateText(text: string, maxLen: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, Math.max(0, maxLen - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}

function processGithubAlerts(html: string): string {
  const ALERT_TYPES = "NOTE|TIP|IMPORTANT|WARNING|CAUTION";
  const CONFIGS: Record<string, { label: string; icon: string }> = {
    NOTE: {
      label: "Note",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
    },
    TIP: {
      label: "Tip",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 14h4a.75.75 0 0 1-.25 1.5H6.25A.75.75 0 0 1 6 14Z"/></svg>',
    },
    IMPORTANT: {
      label: "Important",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    },
    WARNING: {
      label: "Warning",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    },
    CAUTION: {
      label: "Caution",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
    },
  };

  function makeAlert(type: string, body: string): string {
    const cfg = CONFIGS[type.toUpperCase()];
    if (!cfg) return "";
    const cls = type.toLowerCase();
    return `<div class="markdown-alert markdown-alert-${cls}"><p class="markdown-alert-title">${cfg.icon}${cfg.label}</p>${body}</div>`;
  }

  // Case 1: [!TYPE] is its own paragraph (blank line between type and content)
  let result = html.replace(
    new RegExp(
      `<blockquote>\\s*<p>\\[!(${ALERT_TYPES})\\]<\\/p>([\\s\\S]*?)<\\/blockquote>`,
      "gi",
    ),
    (_, type, body) => makeAlert(type, body),
  );

  // Case 2: [!TYPE]\ncontent merged in one paragraph (no blank line in source)
  result = result.replace(
    new RegExp(
      `<blockquote>\\s*<p>\\[!(${ALERT_TYPES})\\]\\n([\\s\\S]*?)<\\/p>([\\s\\S]*?)<\\/blockquote>`,
      "gi",
    ),
    (_, type, firstContent, rest) =>
      makeAlert(type, `<p>${firstContent.trim()}</p>${rest}`),
  );

  return result;
}

function injectCopyButtons(html: string): string {
  const copyButtonHtml =
    '<button class="copy-button" type="button" title="Copy code" onclick=\'(function(btn){var pre=btn.parentElement;var code=pre?pre.querySelector("code"):null;var text=code?code.textContent||"":"";if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy";},2000);});}})(this)\'>Copy</button>';

  return html.replace(/<pre(\b[^>]*)><code/gi, `<pre$1>${copyButtonHtml}<code`);
}

function collectMarkdownFiles(dir: string, basePath = ""): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".md")) {
      files.push(rel);
    }
  }
  return files;
}

function buildFileTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const filePath of files) {
    const parts = filePath.replace(/\.md$/, "").split(path.sep);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      const existing = current.find((n) => n.name === part);
      if (existing) {
        if (existing.children) {
          current = existing.children;
        }
      } else {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
        };
        if (!isFile) {
          node.children = [];
          current.push(node);
          current = node.children;
        } else {
          current.push(node);
        }
      }
    }
  }

  return root;
}

async function main() {
  const envSiteUrl =
    (process.env.SITE_URL && process.env.SITE_URL.trim().length > 0
      ? process.env.SITE_URL
      : null) ?? readDotEnvValue("SITE_URL");
  const siteUrl = normalizeSiteUrl(envSiteUrl || DEFAULT_SITE_URL);
  if (!/^https?:\/\//i.test(siteUrl)) {
    console.warn(
      `⚠️ SITE_URL looks unusual (expected http(s)://...). Using as-is: ${siteUrl}`,
    );
  }

  // Initialize Shiki highlighter
  const highlighter = await createHighlighterCore({
    themes: [
      import("shiki/themes/vitesse-dark.mjs"),
      import("shiki/themes/vitesse-light.mjs"),
    ],
    langs: [
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/yaml.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/html.mjs"),
      import("shiki/langs/markdown.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/dax.mjs"),
      import("shiki/langs/csharp.mjs"),
      import("shiki/langs/powershell.mjs"),
      import("shiki/langs/bicep.mjs"),
      import("shiki/langs/hcl.mjs"),
      import("shiki/langs/sql.mjs"),
    ],
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });

  const md = MarkdownIt({ html: true });
  md.use(
    fromHighlighter(highlighter as Parameters<typeof fromHighlighter>[0], {
      themes: {
        dark: "vitesse-dark",
        light: "vitesse-light",
      },
      defaultColor: false,
    }),
  );

  // Open external links in a new tab with safe rel attributes
  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet("href");

    if (href && /^https?:\/\//i.test(href)) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  const markdownFiles = collectMarkdownFiles(CONTENT_DIR);
  const postsMeta: PostMeta[] = [];
  const archiveMeta: PostMeta[] = [];
  const searchDocs: DocEntry[] = [];
  const postPlainTextBySlug = new Map<string, string>();

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_CONTENT_DIR, { recursive: true });

  for (const relPath of markdownFiles) {
    const fullPath = path.join(CONTENT_DIR, relPath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const html = injectCopyButtons(processGithubAlerts(md.render(content)));
    const slug = relPath.replace(/\.md$/, "");

    // Write HTML output
    const outputPath = path.join(OUTPUT_CONTENT_DIR, `${slug}.html`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");

    // Collect post metadata (only for posts/ directory)
    if (relPath.startsWith("posts/") || relPath.startsWith("posts\\")) {
      const postSlug = slug.replace(/^posts\//, "");
      postPlainTextBySlug.set(postSlug, stripHtml(html));
      postsMeta.push({
        slug: postSlug,
        title: (frontmatter.title as string) || postSlug,
        date: frontmatter.date
          ? new Date(frontmatter.date as string).toISOString().split("T")[0]
          : "",
        tags: (frontmatter.tags as string[]) || [],
        description: (frontmatter.description as string) || "",
      });
    }

    // Collect archive metadata (only for archive/ directory)
    if (relPath.startsWith("archive/") || relPath.startsWith("archive\\")) {
      const archiveSlug = slug.replace(/^archive\//, "");
      archiveMeta.push({
        slug: archiveSlug,
        title: (frontmatter.title as string) || archiveSlug,
        date: frontmatter.date
          ? new Date(frontmatter.date as string).toISOString().split("T")[0]
          : "",
        tags: (frontmatter.tags as string[]) || [],
        description: (frontmatter.description as string) || "",
      });
    }

    // Collect search documents
    searchDocs.push({
      id: slug,
      title: (frontmatter.title as string) || slug,
      description: (frontmatter.description as string) || "",
      content: stripHtml(html),
      tags: ((frontmatter.tags as string[]) || []).join(" "),
    });
  }

  // Sort posts by date descending
  postsMeta.sort((a, b) => b.date.localeCompare(a.date));

  // Sort archive by date descending
  archiveMeta.sort((a, b) => b.date.localeCompare(a.date));

  // Generate RSS feed (posts only)
  const channelTitle = "Raphael Pothin - Developer Blog";
  const channelLink = `${siteUrl}/`;
  const channelDescription =
    "Raphael Pothin's developer blog about Power Platform, GitHub, and open source";
  const lastBuildDate = new Date().toUTCString();

  const rssItemsXml = postsMeta
    .slice(0, RSS_ITEM_LIMIT)
    .map((post) => {
      const postUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}`;
      const pubDate = toRssPubDate(post.date);
      const plainText = postPlainTextBySlug.get(post.slug) || "";
      const summarySource =
        post.description && post.description.trim().length > 0
          ? post.description
          : truncateText(plainText, 240);

      const categories = (post.tags || [])
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => `      <category>${xmlEscape(t.trim())}</category>`)
        .join("\n");

      return [
        "    <item>",
        `      <title>${xmlEscape(post.title || post.slug)}</title>`,
        `      <link>${xmlEscape(postUrl)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(postUrl)}</guid>`,
        pubDate ? `      <pubDate>${xmlEscape(pubDate)}</pubDate>` : null,
        `      <description>${xmlEscape(summarySource)}</description>`,
        categories || null,
        "    </item>",
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n");
    })
    .join("\n");

  const rssXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${xmlEscape(channelTitle)}</title>`,
    `    <link>${xmlEscape(channelLink)}</link>`,
    `    <description>${xmlEscape(channelDescription)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${xmlEscape(lastBuildDate)}</lastBuildDate>`,
    rssItemsXml,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  fs.writeFileSync(RSS_OUTPUT_PATH, rssXml, "utf-8");

  // Build file tree
  const fileTree = buildFileTree(markdownFiles);

  // Build Lunr search index
  const searchIndex = lunr(function () {
    this.ref("id");
    this.field("title", { boost: 10 });
    this.field("description", { boost: 7 });
    this.field("content");
    this.field("tags", { boost: 5 });

    for (const doc of searchDocs) {
      this.add(doc);
    }
  });

  // Write output files
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "file-tree.json"),
    JSON.stringify(fileTree, null, 2),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "search-index.json"),
    JSON.stringify(searchIndex),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "posts-meta.json"),
    JSON.stringify(postsMeta, null, 2),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "archive-meta.json"),
    JSON.stringify(archiveMeta, null, 2),
    "utf-8",
  );

  console.log(`✅ Built ${markdownFiles.length} content files`);
  console.log(`✅ Generated file-tree.json`);
  console.log(`✅ Generated search-index.json`);
  console.log(`✅ Generated posts-meta.json with ${postsMeta.length} posts`);
  console.log(
    `✅ Generated archive-meta.json with ${archiveMeta.length} archive entries`,
  );
  console.log(
    `✅ Generated rss.xml with ${Math.min(postsMeta.length, RSS_ITEM_LIMIT)} posts`,
  );
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
