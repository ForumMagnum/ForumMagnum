'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tree, type NodeApi, type NodeRendererProps } from 'react-arborist';
import { gql } from '@/lib/generated/gql-codegen';
import { useLazyQuery } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import Loading from '../vulcan-core/Loading';
import { useResearchWorkspaceApiOptional } from './researchWorkspaceContext';
import { researchMono, researchWarmAlpha, researchScrollbars, researchUiSans } from './researchStyleUtils';
import { formatBytes } from './formatBytes';

const SandboxDirectoryQuery = gql(`
  query ResearchSandboxDirectory($conversationId: String!, $path: String) {
    researchSandboxDirectory(conversationId: $conversationId, path: $path) {
      path
      running
      entries {
        name
        kind
        size
      }
    }
  }
`);

interface FileNode {
  id: string;
  name: string;
  kind: string;
  size: number | null;
  // null = an unloaded directory (has a twisty, fetched on open); undefined =
  // a leaf (file/symlink). An empty array = a loaded, empty directory.
  children: FileNode[] | null | undefined;
}

function isDir(kind: string) {
  return kind === 'directory';
}

function entryToNode(parentPath: string, entry: { name: string; kind: string; size: number | null }): FileNode {
  const id = parentPath === '/' ? `/${entry.name}` : `${parentPath}/${entry.name}`;
  return {
    id,
    name: entry.name,
    kind: entry.kind,
    size: entry.size,
    children: isDir(entry.kind) ? null : undefined,
  };
}

function setChildren(nodes: FileNode[], id: string, children: FileNode[]): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, children };
    if (node.children && node.children.length > 0) {
      return { ...node, children: setChildren(node.children, id, children) };
    }
    return node;
  });
}

const ROW_HEIGHT = 24;

const styles = defineStyles('SandboxFileBrowser', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    fontFamily: researchUiSans,
  },
  treeWrap: {
    flex: 1,
    minHeight: 0,
    ...researchScrollbars(theme),
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: ROW_HEIGHT,
    paddingRight: 8,
    fontSize: 13,
    color: theme.palette.text.primary,
    cursor: 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    '&:hover': {
      background: researchWarmAlpha(0.05),
    },
  },
  glyph: {
    flex: 'none',
    width: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.dim,
    '--icon-size': '13px',
    transition: 'transform 100ms ease',
  },
  glyphOpen: {
    transform: 'rotate(90deg)',
  },
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nameDir: {
    fontWeight: 600,
  },
  size: {
    flex: 'none',
    fontFamily: researchMono,
    fontSize: 10.5,
    color: researchWarmAlpha(0.4),
  },
  message: {
    padding: '16px 12px',
    fontSize: 13,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

interface SandboxFileBrowserProps {
  conversationId: string;
}

export const SandboxFileBrowser = ({ conversationId }: SandboxFileBrowserProps) => {
  const classes = useStyles(styles);
  const workspace = useResearchWorkspaceApiOptional();
  const [loadDirectory] = useLazyQuery(SandboxDirectoryQuery, { fetchPolicy: 'network-only' });
  const [treeData, setTreeData] = useState<FileNode[] | null>(null);
  const [running, setRunning] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 240, height: 320 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const loadingPathsRef = useRef<Set<string>>(new Set());

  const fetchDirectory = useCallback(async (path: string | null) => {
    const { data, error: queryError } = await loadDirectory({ variables: { conversationId, path } });
    if (queryError) throw queryError;
    if (!data) throw new Error('No response from server');
    return data.researchSandboxDirectory;
  }, [loadDirectory, conversationId]);

  useEffect(() => {
    let cancelled = false;
    setTreeData(null);
    setError(null);
    fetchDirectory(null)
      .then((listing) => {
        if (cancelled) return;
        setRunning(listing.running);
        setTreeData(listing.entries.map((e) => entryToNode(listing.path, e)));
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => { cancelled = true; };
  }, [fetchDirectory]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    let target: FileNode | undefined;
    const walk = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.id === id) { target = n; return; }
        if (n.children) walk(n.children);
      }
    };
    if (treeData) walk(treeData);
    if (!target || target.children !== null) return;
    if (loadingPathsRef.current.has(id)) return;
    loadingPathsRef.current.add(id);
    try {
      const listing = await fetchDirectory(id);
      setRunning(listing.running);
      setTreeData((prev) => prev && setChildren(prev, id, listing.entries.map((e) => entryToNode(id, e))));
    } catch {
      // Swallowed: the row stays unloaded and the next expand retries.
    } finally {
      loadingPathsRef.current.delete(id);
    }
  }, [treeData, fetchDirectory]);

  const Node = useCallback(({ node, style, dragHandle }: NodeRendererProps<FileNode>) => {
    const dir = isDir(node.data.kind);
    const onRowClick = () => {
      if (dir) {
        node.toggle();
      } else {
        workspace?.openSandboxFile(conversationId, node.data.id);
      }
    };
    return (
      <div className={classes.row} style={style} ref={dragHandle} onClick={onRowClick}>
        {dir ? (
          <ForumIcon
            icon="ChevronRight"
            className={node.isOpen ? `${classes.glyph} ${classes.glyphOpen}` : classes.glyph}
          />
        ) : (
          <ForumIcon icon="Document" className={classes.glyph} />
        )}
        <span className={dir ? `${classes.name} ${classes.nameDir}` : classes.name}>{node.data.name}</span>
        {node.data.size != null ? <span className={classes.size}>{formatBytes(node.data.size)}</span> : null}
      </div>
    );
  }, [classes, workspace, conversationId]);

  let body: React.ReactNode;
  if (error) {
    body = <div className={classes.message}>Couldn’t load files: {error}</div>;
  } else if (treeData === null) {
    body = <Loading />;
  } else if (running === false) {
    body = <div className={classes.message}>The sandbox isn’t running. Send a message to start it, then browse its files here.</div>;
  } else if (treeData.length === 0) {
    body = <div className={classes.message}>This workspace is empty.</div>;
  } else {
    body = (
      <Tree<FileNode>
        data={treeData}
        openByDefault={false}
        width={size.width}
        height={size.height}
        rowHeight={ROW_HEIGHT}
        indent={14}
        disableEdit
        disableDrag
        disableDrop
        disableMultiSelection
        onToggle={handleToggle}
      >
        {Node}
      </Tree>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.treeWrap} ref={wrapRef}>
        {body}
      </div>
    </div>
  );
};
