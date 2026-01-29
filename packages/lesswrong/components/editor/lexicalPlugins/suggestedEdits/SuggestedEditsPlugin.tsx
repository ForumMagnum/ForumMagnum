"use client";

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND } from 'lexical';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { MarkNodesProvider } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import type { SuggestionThreadController, SuggestionThreadInfo, SuggestionSummaryType } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { ACCEPT_SUGGESTION_COMMAND, REJECT_SUGGESTION_COMMAND, TOGGLE_SUGGESTION_MODE_COMMAND } from './Commands';
import { SuggestionModePlugin } from './SuggestionModePlugin';

const styles = defineStyles('SuggestedEditsPlugin', (theme: ThemeType) => ({
  panel: {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    margin: '8px 0',
    padding: '8px 12px',
    background: theme.palette.grey[0],
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 6,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
  },
  panelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  panelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  panelActions: {
    display: 'flex',
    gap: 6,
  },
  panelButton: {
    border: 0,
    borderRadius: 4,
    padding: '2px 8px',
    cursor: 'pointer',
    background: theme.palette.grey[200],
    '&:hover': {
      background: theme.palette.grey[300],
    },
  },
  panelButtonPrimary: {
    background: theme.palette.primary.main,
    color: theme.palette.grey[0],
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
}));

type LocalSuggestionThread = SuggestionThreadInfo & {
  summary: string;
  type: SuggestionSummaryType;
  status: 'open' | 'rejected';
};

const parseSummary = (summary: string) => {
  try {
    const parsed = JSON.parse(summary) as Array<{ type: string; content: string; replaceWith?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 'Suggestion';
    }
    const first = parsed[0];
    if (!first) {
      return summary;
    }
    if (first.replaceWith) {
      return `${first.type}: ${first.content} → ${first.replaceWith}`;
    }
    return first.content ? `${first.type}: ${first.content}` : first.type;
  } catch {
    return summary;
  }
};

const useLocalSuggestionThreadController = (): [SuggestionThreadController, LocalSuggestionThread[], (threads: LocalSuggestionThread[]) => void] => {
  const [threads, setThreads] = useState<LocalSuggestionThread[]>([]);
  const threadsRef = useRef<LocalSuggestionThread[]>(threads);

  const updateThreads = useCallback((next: LocalSuggestionThread[]) => {
    threadsRef.current = next;
    setThreads(next);
  }, []);

  const controller = useMemo<SuggestionThreadController>(() => {
    return {
      getAllThreads: async () => threadsRef.current,
      createSuggestionThread: async (suggestionID, commentContent, suggestionType) => {
        const existing = threadsRef.current.find((thread) => thread.markID === suggestionID);
        if (existing) {
          return existing;
        }
        const next: LocalSuggestionThread = {
          id: `suggestion-thread-${suggestionID}`,
          markID: suggestionID,
          summary: commentContent,
          type: suggestionType,
          status: 'open',
        };
        updateThreads([...threadsRef.current, next]);
        return next;
      },
      reopenSuggestion: async (threadId) => {
        updateThreads(
          threadsRef.current.map((thread) =>
            thread.id === threadId ? { ...thread, status: 'open' } : thread,
          ),
        );
        return true;
      },
      rejectSuggestion: async (threadId) => {
        updateThreads(
          threadsRef.current.map((thread) =>
            thread.id === threadId ? { ...thread, status: 'rejected' } : thread,
          ),
        );
        return true;
      },
    };
  }, [updateThreads]);

  return [controller, threads, updateThreads];
};

const SuggestedEditsPanel = ({
  threads,
  onResolveSuggestion,
}: {
  threads: LocalSuggestionThread[];
  onResolveSuggestion: (suggestionId: string) => void;
}) => {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();

  const visibleThreads = threads.filter((thread) => thread.status === 'open');

  if (visibleThreads.length === 0) {
    return null;
  }

  const handleAccept = (suggestionID: string) => {
    editor.dispatchCommand(ACCEPT_SUGGESTION_COMMAND, suggestionID);
    onResolveSuggestion(suggestionID);
  };

  const handleReject = (suggestionID: string) => {
    editor.dispatchCommand(REJECT_SUGGESTION_COMMAND, suggestionID);
    onResolveSuggestion(suggestionID);
  };

  return (
    <div className={classes.panel}>
      <div className={classes.panelTitle}>Suggestions</div>
      <div className={classes.panelList}>
        {visibleThreads.map((thread) => (
          <div key={thread.id} className={classes.panelItem}>
            <span>{parseSummary(thread.summary)}</span>
            <div className={classes.panelActions}>
              <button
                type="button"
                className={classes.panelButtonPrimary}
                onClick={() => handleAccept(thread.markID)}
              >
                Accept
              </button>
              <button
                type="button"
                className={classes.panelButton}
                onClick={() => handleReject(thread.markID)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SuggestedEditsPlugin({
  isSuggestionMode,
  onUserModeChange,
}: {
  isSuggestionMode: boolean;
  onUserModeChange: (mode: EditorUserMode) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [controller, threads, updateThreads] = useLocalSuggestionThreadController();
  const handleResolveSuggestion = useCallback(
    (suggestionId: string) => {
      updateThreads(threads.filter((thread) => thread.markID !== suggestionId));
    },
    [threads, updateThreads],
  );

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        const isToggleShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's';
        if (!isToggleShortcut) {
          return false;
        }
        event.preventDefault();
        editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  React.useEffect(() => {
    // ContentEditable handles DOM event interception for suggestion mode.
    return undefined;
  }, []);

  return (
    <MarkNodesProvider>
      <SuggestionModePlugin
        isSuggestionMode={isSuggestionMode}
        controller={controller}
        onUserModeChange={onUserModeChange}
      />
      <SuggestedEditsPanel threads={threads} onResolveSuggestion={handleResolveSuggestion} />
    </MarkNodesProvider>
  );
}
