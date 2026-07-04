'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useStopLexicalEventPropagation } from '@/components/editor/lexicalPlugins/useStopLexicalEventPropagation';
import { researchMono, researchWarmAlpha, researchRadius } from '../researchStyleUtils';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import { ResearchEnvironmentsByProjectQuery } from '../researchEnvironmentsQuery';
import { useResearchEditorEnvironmentOptional } from './ResearchEditorContext';
import {
  $isQueryInputNode,
  type QueryInputSelection,
  RESEARCH_BLANK_RUNTIMES,
  DEFAULT_BLANK_RUNTIME,
  encodeSelection,
  decodeSelection,
} from './QueryInputNode';

const styles = defineStyles('QueryInputHeader', (theme: ThemeType) => ({
  cluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '1px 2px',
  },
  select: {
    background: 'transparent',
    border: 'none',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 10.5,
    color: theme.palette.text.dim,
    padding: '1px 2px',
    maxWidth: 200,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
    },
    '&:disabled': {
      color: theme.palette.text.dim,
      cursor: 'default',
    },
  },
  runHint: {
    fontFamily: researchMono,
    fontSize: 10.5,
    color: researchWarmAlpha(0.4),
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
}));

interface QueryInputHeaderComponentProps {
  containerNodeKey: string;
  selection: QueryInputSelection;
}

function storageKeyForProject(projectId: string): string {
  return `research:lastSelectedEnvironment:${projectId}`;
}

function resolveDefaultSelection(projectId: string | null): QueryInputSelection {
  if (projectId) {
    const last = getBrowserLocalStorage()?.getItem(storageKeyForProject(projectId)) ?? null;
    const decoded = last ? decodeSelection(last) : null;
    if (decoded?.runtime && (RESEARCH_BLANK_RUNTIMES as readonly string[]).includes(decoded.runtime)) {
      return decoded;
    }
  }
  return { baseEnvironmentId: null, runtime: DEFAULT_BLANK_RUNTIME };
}

export function QueryInputHeaderComponent({
  containerNodeKey,
  selection,
}: QueryInputHeaderComponentProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const selectRef = useRef<HTMLSelectElement>(null);
  const hasHydratedRef = useRef(false);
  const env = useResearchEditorEnvironmentOptional();
  const projectId = env?.projectId ?? null;

  // The selection lives on the parent QueryInputNode, but decorate() only
  // re-runs when this DecoratorNode is dirty — not when the parent mutates.
  // Track it locally for immediate select feedback, and re-read the parent from
  // editor state so undo/redo and hydration stay in sync.
  const [selected, setSelected] = useState<QueryInputSelection>(selection);

  useStopLexicalEventPropagation(selectRef);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const parent = $getNodeByKey(containerNodeKey);
        if ($isQueryInputNode(parent)) {
          const next = parent.getSelection();
          setSelected((prev) =>
            prev.baseEnvironmentId === next.baseEnvironmentId && prev.runtime === next.runtime
              ? prev
              : next,
          );
        }
      });
    });
  }, [editor, containerNodeKey]);

  const { data } = useQuery(ResearchEnvironmentsByProjectQuery, {
    variables: { projectId: projectId ?? '' },
    skip: !projectId,
    fetchPolicy: 'cache-first',
  });
  const environments = useMemo(() => data?.researchEnvironments?.results ?? [], [data]);
  const knownEnvIds = useMemo(() => new Set(environments.map((e) => e._id)), [environments]);

  const writeSelectionToContainer = (next: QueryInputSelection) => {
    editor.update(() => {
      const parent = $getNodeByKey(containerNodeKey);
      if ($isQueryInputNode(parent)) parent.setSelection(next);
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = decodeSelection(event.target.value) ?? { baseEnvironmentId: null, runtime: DEFAULT_BLANK_RUNTIME };
    setSelected(next);
    if (projectId) {
      getBrowserLocalStorage()?.setItem(storageKeyForProject(projectId), encodeSelection(next));
    }
    writeSelectionToContainer(next);
  };

  const effective: QueryInputSelection =
    selected.baseEnvironmentId && knownEnvIds.has(selected.baseEnvironmentId)
      ? selected
      : selected.runtime
        ? selected
        : resolveDefaultSelection(projectId);
  const selectValue = encodeSelection(effective);

  // Hydrate untouched / old query-input nodes (no valid selection) once per
  // mount, so the node always carries a concrete env-XOR-runtime by submit time.
  // Never re-hydrate, so an explicit selection isn't clobbered.
  //
  // Critically, wait until the env query has *settled* before deciding a node's
  // saved `baseEnvironmentId` is invalid. On a cold load the cache-first query
  // hasn't resolved yet (`knownEnvIds` empty), and hydrating then would clobber a
  // genuine saved-environment selection with a blank baseline. `data !== undefined`
  // (or no projectId, so the query is skipped and no env could be valid anyway)
  // means it's safe to decide; the effect re-runs when `data` arrives.
  useEffect(() => {
    if (hasHydratedRef.current) return;
    const envQuerySettled = !projectId || data !== undefined;
    if (!envQuerySettled) return;
    hasHydratedRef.current = true;
    editor.getEditorState().read(() => {
      const parent = $getNodeByKey(containerNodeKey);
      if (!$isQueryInputNode(parent)) return;
      const current = parent.getSelection();
      const hasValid =
        (current.baseEnvironmentId && knownEnvIds.has(current.baseEnvironmentId)) ||
        (!current.baseEnvironmentId && current.runtime);
      if (hasValid) return;
      const last = projectId
        ? getBrowserLocalStorage()?.getItem(storageKeyForProject(projectId)) ?? null
        : null;
      const remembered = last ? decodeSelection(last) : null;
      const next: QueryInputSelection =
        remembered?.baseEnvironmentId && knownEnvIds.has(remembered.baseEnvironmentId)
          ? remembered
          : resolveDefaultSelection(projectId);
      setSelected(next);
      writeSelectionToContainer(next);
    });
    // Hydration is intentionally a once-per-mount effect (guarded by
    // hasHydratedRef); it tracks the env-query settle (`data`) and `knownEnvIds`,
    // not the inline `writeSelectionToContainer`/`resolveDefaultSelection` it calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, containerNodeKey, projectId, data, knownEnvIds]);

  return (
    <span className={classes.cluster}>
      <select
        ref={selectRef}
        className={classes.select}
        value={selectValue}
        onChange={handleChange}
      >
        <optgroup label="Blank baseline">
          {RESEARCH_BLANK_RUNTIMES.map((runtime) => (
            <option key={runtime} value={encodeSelection({ baseEnvironmentId: null, runtime })}>
              Blank · {runtime}
            </option>
          ))}
        </optgroup>
        {environments.length > 0 && (
          <optgroup label="Saved environments">
            {environments.map((environment) => (
              <option
                key={environment._id}
                value={encodeSelection({ baseEnvironmentId: environment._id, runtime: null })}
              >
                {environment.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <span className={classes.runHint} title="Run query">⌘↵</span>
    </span>
  );
}
