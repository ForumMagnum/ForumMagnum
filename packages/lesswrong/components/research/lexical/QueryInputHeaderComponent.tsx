'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useStopLexicalEventPropagation } from '@/components/editor/lexicalPlugins/useStopLexicalEventPropagation';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import { CurrentWorkspaceReposQuery } from '../currentWorkspaceReposQuery';
import { $isQueryInputNode } from './QueryInputNode';

const styles = defineStyles('QueryInputHeader', (theme: ThemeType) => ({
  select: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    fontSize: 12,
    color: theme.palette.text.normal,
    padding: '2px 4px',
    maxWidth: 220,
    cursor: 'pointer',
    '&:disabled': {
      color: theme.palette.text.dim,
      cursor: 'default',
    },
  },
}));

interface QueryInputHeaderComponentProps {
  containerNodeKey: string;
  workspaceRepoId: string | null;
}

const STORAGE_KEY = 'research:lastSelectedWorkspaceRepoId';

export function QueryInputHeaderComponent({
  containerNodeKey,
  workspaceRepoId,
}: QueryInputHeaderComponentProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const selectRef = useRef<HTMLSelectElement>(null);
  const hasHydratedRef = useRef(false);
  // workspaceRepoId lives on the parent QueryInputNode, but decorate() only
  // re-runs when this DecoratorNode is dirty — not when the parent mutates.
  // Track the repo locally for immediate select feedback, and re-read the
  // parent from editor state so undo/redo and hydration stay in sync.
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(workspaceRepoId);

  useStopLexicalEventPropagation(selectRef);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const parent = $getNodeByKey(containerNodeKey);
        if ($isQueryInputNode(parent)) {
          const next = parent.getWorkspaceRepoId();
          setSelectedRepoId((prev) => (prev === next ? prev : next));
        }
      });
    });
  }, [editor, containerNodeKey]);

  const { data } = useQuery(CurrentWorkspaceReposQuery, { fetchPolicy: 'cache-first' });
  const repos = useMemo(() => data?.currentWorkspaceRepos ?? [], [data]);
  const hasRepos = repos.length > 0;
  const knownIds = useMemo(() => new Set(repos.map((r) => r._id)), [repos]);

  const writeRepoIdToContainer = (next: string | null) => {
    editor.update(() => {
      const parent = $getNodeByKey(containerNodeKey);
      if ($isQueryInputNode(parent)) parent.setWorkspaceRepoId(next);
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value || null;
    setSelectedRepoId(next);
    const ls = getBrowserLocalStorage();
    if (ls) {
      if (next === null) {
        ls.removeItem(STORAGE_KEY);
      } else {
        ls.setItem(STORAGE_KEY, next);
      }
    }
    writeRepoIdToContainer(next);
  };

  // If the persisted workspaceRepoId points at a repo that no longer exists, fall back to "no repo" in the select.
  const selectValue = selectedRepoId && knownIds.has(selectedRepoId) ? selectedRepoId : '';

  // Hydrate untouched QueryInputs (workspaceRepoId === null) from localStorage
  // once per mount, after the repo list is available — but never re-hydrate,
  // so explicit empty selections aren't clobbered.
  useEffect(() => {
    if (hasHydratedRef.current) return;
    if (repos.length === 0) return;
    hasHydratedRef.current = true;
    editor.getEditorState().read(() => {
      const parent = $getNodeByKey(containerNodeKey);
      if (!$isQueryInputNode(parent) || parent.getWorkspaceRepoId() !== null) return;
      const last = getBrowserLocalStorage()?.getItem(STORAGE_KEY) ?? null;
      if (!last || !knownIds.has(last)) return;
      setSelectedRepoId(last);
      editor.update(() => {
        const node = $getNodeByKey(containerNodeKey);
        if ($isQueryInputNode(node)) node.setWorkspaceRepoId(last);
      });
    });
  }, [editor, containerNodeKey, repos.length, knownIds]);

  if (!hasRepos) {
    return (
      <select className={classes.select} disabled value="">
        <option value="">No repos configured</option>
      </select>
    );
  }

  return (
    <select
      ref={selectRef}
      className={classes.select}
      value={selectValue}
      onChange={handleChange}
    >
      <option value="">No repo</option>
      {repos.map((repo) => (
        <option key={repo._id} value={repo._id}>
          {repo.owner}/{repo.name}
        </option>
      ))}
    </select>
  );
}
