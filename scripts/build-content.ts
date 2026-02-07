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

  const markdownFiles = collectMarkdownFiles(CONTENT_DIR);
  const postsMeta: PostMeta[] = [];
  const searchDocs: DocEntry[] = [];

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_CONTENT_DIR, { recursive: true });

  for (const relPath of markdownFiles) {
    const fullPath = path.join(CONTENT_DIR, relPath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const html = md.render(content);
    const slug = relPath.replace(/\.md$/, "");

    // Write HTML output
    const outputPath = path.join(OUTPUT_CONTENT_DIR, `${slug}.html`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");

    // Collect post metadata (only for posts/ directory)
    if (relPath.startsWith("posts/") || relPath.startsWith("posts\\")) {
      const postSlug = slug.replace(/^posts\//, "");
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

  console.log(`✅ Built ${markdownFiles.length} content files`);
  console.log(`✅ Generated file-tree.json`);
  console.log(`✅ Generated search-index.json`);
  console.log(`✅ Generated posts-meta.json with ${postsMeta.length} posts`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
