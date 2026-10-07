"use client";

import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import moment from '@/lib/moment-timezone';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useNavigate } from '@/lib/routeUtil';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import Loading from '../vulcan-core/Loading';
import { useMessages } from '../common/withMessages';
import {
  researchEyebrow,
  researchGhostButton,
  researchMono,
  researchPrimaryButton,
  researchScrollbars,
  researchTextInput,
  researchCard,
  researchWarmAlpha,
  researchCanvas,
  researchUiSans,
  researchRadius,
} from './researchStyleUtils';

interface ResearchProjectSummary {
  _id: string;
  title: string | null;
  description: string | null;
  createdAt: string;
}

const ResearchProjectsListQuery = gql(`
  query ResearchProjectListQuery {
    researchProjects(selector: { default: {} }, limit: 100) {
      results {
        _id
        title
        description
        createdAt
      }
    }
  }
`);

const ResearchClaudeTokenStatusQuery = gql(`
  query ResearchClaudeTokenStatusQuery($userId: String!) {
    user(selector: { _id: $userId }) {
      result {
        _id
        hasClaudeCodeOAuthToken
      }
    }
  }
`);

const CreateResearchProjectMutation = gql(`
  mutation CreateResearchProject($title: String!, $description: String) {
    createResearchProject(data: { title: $title, description: $description }) {
      data {
        _id
        title
        description
        createdAt
      }
    }
  }
`);

const SetClaudeCodeOAuthTokenMutation = gql(`
  mutation ResearchSetClaudeCodeOAuthToken($token: String!) {
    setClaudeCodeOAuthToken(token: $token) {
      success
    }
  }
`);

const styles = defineStyles('ResearchProjectList', (theme: ThemeType) => ({
  outer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    background: researchCanvas(theme),
    fontFamily: researchUiSans,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    ...researchScrollbars(theme),
  },
  column: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '11vh 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  escapeHatch: {
    position: 'fixed',
    top: 14,
    left: 18,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: researchRadius.xs,
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.05),
    },
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  eyebrow: researchEyebrow(theme),
  title: {
    fontSize: 32,
    fontWeight: 400,
    fontFamily: theme.palette.fonts.headerStack,
    color: theme.palette.text.primary,
    margin: 0,
  },
  newProjectRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  textInput: researchTextInput(theme),
  newProjectTitle: {
    flex: 2,
  },
  newProjectDescription: {
    flex: 3,
  },
  primaryButton: researchPrimaryButton(theme),
  ghostButton: researchGhostButton(theme),
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    borderTop: `1px solid ${researchWarmAlpha(0.07)}`,
  },
  item: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    padding: '11px 8px',
    borderBottom: `1px solid ${researchWarmAlpha(0.07)}`,
    cursor: 'pointer',
    borderRadius: researchRadius.xs,
    '&:hover': {
      background: researchWarmAlpha(0.03),
    },
  },
  itemTitle: {
    flex: 'none',
    fontSize: 17,
    fontWeight: 600,
    fontFamily: theme.palette.fonts.serifStack,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '55%',
  },
  itemDescription: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemDate: {
    flex: 'none',
    fontFamily: researchMono,
    fontSize: 10.5,
    color: researchWarmAlpha(0.35),
  },
  empty: {
    padding: '20px 8px',
    color: theme.palette.text.dim,
    fontSize: 13,
    fontStyle: 'italic',
  },
}));

const claudeCodeTokenStyles = defineStyles('ClaudeCodeToken', (theme: ThemeType) => ({
  tokenCorner: {
    position: 'fixed',
    bottom: 14,
    right: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  tokenChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    background: researchCanvas(theme),
    fontFamily: researchMono,
    fontSize: 10.5,
    color: theme.palette.text.dim,
  },
  tokenChipReplace: {
    background: 'transparent',
    border: 'none',
    color: researchWarmAlpha(0.4),
    fontSize: 10.5,
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'underline',
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  tokenChipSuccess: {
    fontFamily: researchMono,
    fontSize: 10.5,
    color: theme.palette.primary.main,
  },
  setupCard: {
    ...researchCard(theme),
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  setupCardLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: 2,
  },
  setupCardDescription: {
    fontSize: 12.5,
    color: theme.palette.text.dim,
    lineHeight: 1.45,
    marginBottom: 12,
  },
  setupCardRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  textInput: researchTextInput(theme),
  primaryButton: researchPrimaryButton(theme),
  ghostButton: researchGhostButton(theme),
  inlineError: {
    fontSize: 12,
    color: theme.palette.error.main,
    marginTop: 4,
  },
}));

const TOKEN_HINT = 'Run `claude setup-token` locally and paste the result.';

function getTokenSaveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to save Claude Code token.';
}

const ResearchProjectList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [replacingToken, setReplacingToken] = useState(false);
  const [tokenSavedThisSession, setTokenSavedThisSession] = useState(false);
  const [tokenSaveMessage, setTokenSaveMessage] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(ResearchProjectsListQuery, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: tokenStatusData, refetch: refetchTokenStatus } = useQuery(
    ResearchClaudeTokenStatusQuery,
    {
      variables: { userId: currentUser?._id ?? '' },
      skip: !currentUser,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [createProject] = useMutation(CreateResearchProjectMutation);

  const tokenIsSet = tokenSavedThisSession ||
    !!tokenStatusData?.user?.result?.hasClaudeCodeOAuthToken;

  const handleTokenSaved = useCallback(async () => {
    setTokenSavedThisSession(true);
    setTokenSaveMessage('Claude Code token saved.');
    setReplacingToken(false);
    try {
      await refetchTokenStatus();
    } catch {
      // The token was saved; leave the optimistic chip visible even if the status refresh fails.
    }
  }, [refetchTokenStatus]);

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />;
  }

  const projects = data?.researchProjects?.results ?? [];

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const result = await createProject({
        variables: {
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        },
      });
      const created = result.data?.createResearchProject?.data;
      if (created) {
        setNewTitle('');
        setNewDescription('');
        navigate(`/research/projects/${created._id}`);
      } else {
        await refetch();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={classes.outer}>
      <a className={classes.escapeHatch} href="/">← LessWrong</a>
      <div className={classes.scroll}>
        <div className={classes.column}>
          <div className={classes.heading}>
            <span className={classes.eyebrow}>Research workspace</span>
            <h1 className={classes.title}>Projects</h1>
          </div>

          {(!tokenIsSet || replacingToken) && (
            <ClaudeCodeTokenSetup
              tokenIsSet={tokenIsSet}
              onCancel={() => setReplacingToken(false)}
              onSaved={handleTokenSaved}
            />
          )}

          <div className={classes.newProjectRow}>
            <input
              className={classNames(classes.textInput, classes.newProjectTitle)}
              name="research-project-title"
              placeholder="Project title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={creating}
              autoComplete="off"
            />
            <input
              className={classNames(classes.textInput, classes.newProjectDescription)}
              name="research-project-description"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              disabled={creating}
              autoComplete="off"
            />
            <button
              type="button"
              className={classes.primaryButton}
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
            >
              {creating ? 'Creating…' : 'New project'}
            </button>
          </div>

          {loading && projects.length === 0 ? <Loading /> : null}
          {!loading && projects.length === 0 ? (
            <div className={classes.empty}>
              No research projects yet — create one above to get started.
            </div>
          ) : (
            <ul className={classes.list}>
              {projects.map((project) => (
                <ProjectListItem
                  key={project._id}
                  project={project}
                  onOpen={() => navigate(`/research/projects/${project._id}`)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      {tokenIsSet && !replacingToken && (
        <ClaudeCodeTokenChip
          saveMessage={tokenSaveMessage}
          onReplaceClick={() => {
            setTokenSaveMessage(null);
            setReplacingToken(true);
          }}
        />
      )}
    </div>
  );
};

function ClaudeCodeTokenChip({
  saveMessage,
  onReplaceClick,
}: {
  saveMessage: string | null;
  onReplaceClick: () => void;
}) {
  const classes = useStyles(claudeCodeTokenStyles);
  return (
    <div className={classes.tokenCorner}>
      {saveMessage && <span className={classes.tokenChipSuccess}>{saveMessage}</span>}
      <span className={classes.tokenChip}>
        <span>claude token ✓</span>
        <button
          type="button"
          className={classes.tokenChipReplace}
          onClick={onReplaceClick}
        >replace</button>
      </span>
    </div>
  );
}

function ClaudeCodeTokenSetup({
  tokenIsSet,
  onCancel,
  onSaved,
}: {
  tokenIsSet: boolean;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const classes = useStyles(claudeCodeTokenStyles);
  const { flash } = useMessages();
  const [tokenDraft, setTokenDraft] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [setClaudeCodeOAuthToken] = useMutation(SetClaudeCodeOAuthTokenMutation);

  const handleSave = async () => {
    const value = tokenDraft.trim();
    if (!value || saving) return;
    if (/\s/.test(tokenDraft.trim())) {
      setTokenError('Token contains whitespace; copy without spaces or newlines.');
      return;
    }
    setTokenError(null);
    setSaving(true);
    let saved = false;
    try {
      await setClaudeCodeOAuthToken({ variables: { token: value } });
      flash({ messageString: 'Claude Code token saved.', type: 'success' });
      setTokenDraft('');
      saved = true;
    } catch (error) {
      setTokenError(getTokenSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
    if (saved) {
      await onSaved();
    }
  };

  return (
    <div className={classes.setupCard}>
      <div className={classes.setupCardLabel}>
        {tokenIsSet ? 'Replace Claude Code token' : 'Set up your Claude Code token'}
      </div>
      <div className={classes.setupCardDescription}>{TOKEN_HINT}</div>
      <div className={classes.setupCardRow}>
        <input
          className={classes.textInput}
          type="password"
          name="research-claude-token"
          placeholder="Paste OAuth token"
          value={tokenDraft}
          onChange={(e) => {
            setTokenDraft(e.target.value);
            if (tokenError) setTokenError(null);
          }}
          disabled={saving}
          autoComplete="new-password"
          spellCheck={false}
        />
        {tokenIsSet && (
          <button
            type="button"
            className={classes.ghostButton}
            onClick={() => { onCancel(); setTokenDraft(''); setTokenError(null); }}
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className={classes.primaryButton}
          onClick={handleSave}
          disabled={saving || !tokenDraft.trim()}
        >
          {saving ? 'Saving…' : 'Save token'}
        </button>
      </div>
      {tokenError && <div className={classes.inlineError}>{tokenError}</div>}
    </div>
  );
}

function ProjectListItem({
  project,
  onOpen,
}: {
  project: ResearchProjectSummary;
  onOpen: () => void;
}) {
  const classes = useStyles(styles);
  return (
    <li className={classes.item} onClick={onOpen}>
      <span className={classes.itemTitle}>{project.title}</span>
      <span className={classes.itemDescription}>{project.description ?? ''}</span>
      <span className={classes.itemDate}>{moment(project.createdAt).format('MMM D')}</span>
    </li>
  );
}

export default ResearchProjectList;
