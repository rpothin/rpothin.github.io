import { useState, useEffect, useCallback, useRef } from "react";
import lunr from "lunr";
import type { PostMeta, SearchResult } from "../types";

export function useSearch() {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const indexRef = useRef<lunr.Index | null>(null);
  const allMetaRef = useRef<Map<string, PostMeta>>(new Map());

  useEffect(() => {
    async function load() {
      try {
        const [indexRes, metaRes, archiveRes] = await Promise.all([
          fetch("/search-index.json"),
          fetch("/posts-meta.json"),
          fetch("/archive-meta.json"),
        ]);
        const indexData = await indexRes.json();
        const metaData: PostMeta[] = await metaRes.json();
        const archiveData: PostMeta[] = await archiveRes.json();

        indexRef.current = lunr.Index.load(indexData);

        const map = new Map<string, PostMeta>();
        for (const post of metaData) {
          map.set(`posts/${post.slug}`, post);
        }
        for (const item of archiveData) {
          map.set(`archive/${item.slug}`, item);
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

  const executeSearch = useCallback((q: string) => {
    if (!q.trim() || !indexRef.current) {
      setResults([]);
      return;
    }
    try {
      const lunrResults = indexRef.current.search(q);
      const mapped: SearchResult[] = lunrResults
        .map((r) => {
          const meta = allMetaRef.current.get(r.ref);
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

  // Re-run the search once the index finishes loading (handles the case
  // where a query was set before the index was ready)
  useEffect(() => {
    if (!isLoading && query) {
      executeSearch(query);
    }
  }, [isLoading, query, executeSearch]);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      executeSearch(q);
    },
    [executeSearch],
  );

  return { query, setQuery, results, isLoading };
}
