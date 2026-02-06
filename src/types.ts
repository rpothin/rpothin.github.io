export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
}

export interface SearchResult {
  ref: string;
  score: number;
  title: string;
  description: string;
  date: string;
  tags: string[];
}
