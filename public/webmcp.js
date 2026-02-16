/**
 * WebMCP Integration for rpothin.github.io
 * Exposes structured tools for AI agents to interact with this website.
 * Requires a browser with WebMCP support (e.g. Chrome 146+ with WebMCP flag enabled).
 *
 * Learn more: https://AIsdk.dev/docs/foundations/web-mcp
 */

(function () {
  var MAX_CONTENT_LENGTH = 5000;
  // Guard: only run if WebMCP API is available
  if (!navigator.modelContext) {
    console.log(
      "[WebMCP] navigator.modelContext not available — skipping tool registration.",
    );
    return;
  }

  console.log("[WebMCP] Registering tools for rpothin.github.io...");

  // ============================================================
  // Tool 1: Search Posts
  // ============================================================
  navigator.modelContext.registerTool({
    name: "searchPosts",
    description:
      "Search blog posts by keyword using the full-text search index. Returns matching post titles, URLs, dates, and descriptions. The blog covers Power Platform governance, security, AI-native software engineering, and developer experience.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search keyword or phrase to find in post titles, descriptions, content, and tags",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of results to return (default: 10, max: 50)",
        },
      },
      required: ["query"],
    },
    async execute({ query, limit = 10 }) {
      limit = Math.min(Math.max(1, limit), 50);

      try {
        const [indexRes, metaRes] = await Promise.all([
          fetch("/search-index.json"),
          fetch("/posts-meta.json"),
        ]);

        if (!indexRes.ok || !metaRes.ok) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Could not load search data.",
                }),
              },
            ],
          };
        }

        const [indexData, postsMeta] = await Promise.all([
          indexRes.json(),
          metaRes.json(),
        ]);

        // Load Lunr and search — lunr is already bundled in the page
        if (typeof lunr === "undefined") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Search engine (Lunr) is not available on this page.",
                }),
              },
            ],
          };
        }

        const idx = lunr.Index.load(indexData);
        const searchResults = idx.search(query);

        // Build a lookup from posts metadata
        const metaBySlug = {};
        for (const post of postsMeta) {
          metaBySlug[post.slug] = post;
        }

        const results = searchResults.slice(0, limit).map((result) => {
          // result.ref is the slug (e.g. "posts/welcome")
          const slug = result.ref.replace(/^posts\//, "");
          const meta = metaBySlug[slug];
          return {
            title: meta ? meta.title : slug,
            url: window.location.origin + "/posts/" + slug,
            date: meta ? meta.date : "",
            description: meta ? meta.description : "",
            tags: meta ? meta.tags : [],
            score: result.score,
          };
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query,
                count: results.length,
                total: searchResults.length,
                results,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Search failed: " + (err.message || String(err)),
              }),
            },
          ],
        };
      }
    },
  });

  // ============================================================
  // Tool 2: Get About / Author Info
  // ============================================================
  navigator.modelContext.registerTool({
    name: "getAbout",
    description:
      "Get author profile information including name, title, focus areas, career path, and contact links for Raphael Pothin.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    async execute() {
      const about = {
        name: "Raphael Pothin",
        title: "Microsoft MVP (Business Applications)",
        focus: [
          "Power Platform governance, security, and developer experience",
          "AI-native software engineering",
          "AI Coding Agent Experience",
          "Platform engineering for Power Platform",
        ],
        careerPath: [
          "CRM Consultant",
          "Technical Product Owner",
          'Power Platform "SRE" / Technical Lead',
          "Platform Engineering & AI-native Software Engineering",
        ],
        currentlyExploring: [
          "Terraform + Power Platform for governance and developer experience",
          "AI-native software engineering with engineering rigor",
        ],
        links: {
          website: "https://rpothin.github.io",
          github: "https://github.com/rpothin",
          linkedin:
            "https://www.linkedin.com/in/raphael-pothin-642bb657/?locale=en_US",
          aboutPage: window.location.origin + "/about",
        },
        blogTopics: [
          "Power Platform governance and security",
          "AI-native engineering patterns",
          "Developer experience and platform engineering",
          "Shipping and software craftsmanship",
        ],
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(about),
          },
        ],
      };
    },
  });

  // ============================================================
  // Tool 3: Get Post Content (when on a post page)
  // ============================================================
  navigator.modelContext.registerTool({
    name: "getPostContent",
    description:
      "Get the full text content of the currently viewed blog post, including title, date, tags, and body text. Works best when already on a post page (/posts/...).",
    inputSchema: {
      type: "object",
      properties: {},
    },
    async execute() {
      const path = window.location.pathname;

      if (!path.startsWith("/posts/")) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error:
                  "Not currently on a post page. Navigate to a post first using navigateSite or by visiting a post URL.",
                currentPage: path,
                suggestion:
                  "Use listRecentPosts or searchPosts to find a post, then use navigateSite to go to it.",
              }),
            },
          ],
        };
      }

      const title =
        document.querySelector("h1")?.textContent?.trim() || document.title;
      const contentEl =
        document.querySelector("article") ||
        document.querySelector("main") ||
        document.querySelector("#root");
      const bodyText = contentEl?.textContent?.trim() || "";

      // Try to extract date and tags from metadata
      const slug = path.replace("/posts/", "");
      let date = "";
      let tags = [];
      let description = "";

      try {
        const metaRes = await fetch("/posts-meta.json");
        if (metaRes.ok) {
          const postsMeta = await metaRes.json();
          const meta = postsMeta.find((p) => p.slug === slug);
          if (meta) {
            date = meta.date || "";
            tags = meta.tags || [];
            description = meta.description || "";
          }
        }
      } catch (_) {
        // Metadata fetch failed — continue with what we have
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              title,
              slug,
              date,
              tags,
              description,
              url: window.location.href,
              content: bodyText.substring(0, MAX_CONTENT_LENGTH),
              truncated: bodyText.length > MAX_CONTENT_LENGTH,
            }),
          },
        ],
      };
    },
  });

  // ============================================================
  // Tool 4: Navigate Site
  // ============================================================
  navigator.modelContext.registerTool({
    name: "navigateSite",
    description:
      "Navigate to a specific page on rpothin.github.io. Available pages: home (post listing), about (author profile), privacy (analytics policy). You can also navigate to a specific post by providing its slug.",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "string",
          description:
            'Page to navigate to: "home", "about", "privacy", or a post slug (e.g. "welcome")',
        },
      },
      required: ["page"],
    },
    async execute({ page }) {
      const pages = {
        home: "/",
        about: "/about",
        privacy: "/privacy",
      };

      let url = pages[page];

      // If not a named page, treat as a post slug
      if (!url) {
        // Basic slug validation: alphanumeric, hyphens, and underscores only
        if (/^[a-zA-Z0-9_-]+$/.test(page)) {
          url = "/posts/" + page;
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Unknown page or invalid post slug.",
                  availablePages: Object.keys(pages),
                  tip: 'For posts, provide the slug (e.g. "welcome").',
                }),
              },
            ],
          };
        }
      }

      window.location.href = url;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ navigated: true, page, url }),
          },
        ],
      };
    },
  });

  // ============================================================
  // Tool 5: List Recent Posts
  // ============================================================
  navigator.modelContext.registerTool({
    name: "listRecentPosts",
    description:
      "List the most recent blog posts with titles, dates, descriptions, tags, and URLs. Posts are sorted by date (newest first).",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Number of recent posts to return (default: 10, max: 50)",
        },
      },
    },
    async execute({ limit = 10 } = {}) {
      limit = Math.min(Math.max(1, limit), 50);

      try {
        const res = await fetch("/posts-meta.json");
        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Could not load posts metadata.",
                }),
              },
            ],
          };
        }

        const postsMeta = await res.json();
        const posts = postsMeta.slice(0, limit).map((post) => ({
          title: post.title,
          url: window.location.origin + "/posts/" + post.slug,
          date: post.date,
          description: post.description,
          tags: post.tags,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: posts.length,
                total: postsMeta.length,
                posts,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error:
                  "Failed to load posts: " + (err.message || String(err)),
              }),
            },
          ],
        };
      }
    },
  });

  console.log(
    "[WebMCP] ✅ 5 tools registered: searchPosts, getAbout, getPostContent, navigateSite, listRecentPosts",
  );
})();
