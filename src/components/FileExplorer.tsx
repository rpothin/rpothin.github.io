import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TreeNode } from '../types';

interface FileExplorerProps {
  currentPath: string;
}

function TreeItem({
  node,
  currentPath,
  depth,
  onNavigate,
}: {
  node: TreeNode;
  currentPath: string;
  depth: number;
  onNavigate: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = currentPath === node.path;
  const isFolder = node.type === 'folder';

  return (
    <div>
      <button
        className="w-full text-left flex items-center gap-1 py-0.5 pr-2 text-sm cursor-pointer"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          backgroundColor: isActive
            ? 'var(--vscode-list-activeSelectionBackground)'
            : undefined,
          color: isActive
            ? 'var(--vscode-list-activeSelectionForeground)'
            : 'var(--vscode-editor-foreground)',
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            e.currentTarget.style.backgroundColor =
              'var(--vscode-list-hoverBackground)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = '';
        }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onNavigate(node.path);
          }
        }}
      >
        <span className="flex-shrink-0 w-4 text-center text-xs">
          {isFolder ? (expanded ? '▾' : '▸') : ''}
        </span>
        <span className="flex-shrink-0">
          {isFolder ? (expanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              currentPath={currentPath}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ currentPath }: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/file-tree.json')
      .then((r) => r.json())
      .then(setTree)
      .catch(console.error);
  }, []);

  const handleNavigate = (filePath: string) => {
    if (filePath === 'about') {
      navigate('/about');
    } else if (filePath.startsWith('posts/')) {
      const slug = filePath.replace('posts/', '');
      navigate(`/posts/${slug}`);
    }
  };

  return (
    <div className="py-1">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          currentPath={currentPath}
          depth={0}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
}
