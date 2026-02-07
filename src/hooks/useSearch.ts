import { useState, useEffect, useCallback, useRef } from "react";
import lunr from "lunr";
import type { PostMeta, SearchResult } from "../types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const indexRef = useRef<lunr.Index | null>(null);
  const metaRef = useRef<PostMeta[]>([]);
  const allMetaRef = useRef<Map<string, PostMeta>>(new Map());

  useEffect(() => {
    async function load() {
      try {
        const [indexRes, metaRes] = await Promise.all([
          fetch("/search-index.json"),
          fetch("/posts-meta.json"),
        ]);
        const indexData = await indexRes.json();
        const metaData: PostMeta[] = await metaRes.json();

        indexRef.current = lunr.Index.load(indexData);
        metaRef.current = metaData;

        const map = new Map<string, PostMeta>();
        for (const post of metaData) {
          map.set(`posts/${post.slug}`, post);
        }
        allMetaRef.current = map;
      } catch (e) {
        console.error("Failed to load search index:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim() || !indexRef.current) {
      setResults([]);
      return;
    }
    try {
      const lunrResults = indexRef.current.search(q);
      const mapped: SearchResult[] = lunrResults
        .map((r) => {
          const meta = allMetaRef.current.get(r.ref);
          // Handle About page with proper title/description
          if (r.ref === "about") {
            return {
              ref: r.ref,
              score: r.score,
              title: "About",
              description: "Learn more about me",
              date: "",
              tags: [],
            };
          }
          return {
            ref: r.ref,
            score: r.score,
            title: meta?.title || r.ref,
            description: meta?.description || "",
            date: meta?.date || "",
            tags: meta?.tags || [],
          };
        })
        .slice(0, 20);
      setResults(mapped);
    } catch {
      setResults([]);
    }
  }, []);

  return { query, setQuery: search, results, isLoading };
}
