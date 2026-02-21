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

    const html = injectCopyButtons(md.render(content));
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
