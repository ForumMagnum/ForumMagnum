"use client";

import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useNavigate } from '@/lib/routeUtil';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import Loading from '../vulcan-core/Loading';

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

function researchPlainTextInputStyles(theme: ThemeType) {
  return {
    flex: 1,
    width: '100%',
    boxSizing: 'border-box' as const,
    border: theme.palette.border.normal,
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 14,
    color: theme.palette.grey[900],
    background: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    outline: 'none',
    '&:hover': {
      border: theme.palette.border.slightlyIntense,
    },
    '&:focus': {
      // Global styles zero out input borders on focus; restate the full border or the edge disappears.
      border: theme.palette.border.slightlyIntense2,
    },
    '&::placeholder': { color: theme.palette.grey[400] },
    '&:disabled': {
      background: theme.palette.greyAlpha(0.04),
      color: theme.palette.grey[500],
      cursor: 'not-allowed',
    },
  };
}

const styles = defineStyles('ResearchProjectList', (theme: ThemeType) => ({
  outer: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    minHeight: 0,
    background: theme.palette.background.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  panes: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  leftPaneInner: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 24px 64px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  newProjectRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  textInput: researchPlainTextInputStyles(theme),
  newProjectTitle: {
    flex: 2,
  },
  newProjectDescription: {
    flex: 3,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: theme.palette.grey[500],
    fontSize: 13,
  },
}));

const claudeCodeTokenStyles = defineStyles('ClaudeCodeToken', (theme: ThemeType) => ({
  tokenChipRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 24px 0',
  },
  tokenChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 12,
    background: theme.palette.greyAlpha(0.05),
    fontSize: 12.5,
    color: theme.palette.grey[700],
    fontFamily: theme.typography.fontFamily,
  },
  tokenChipReplace: {
    background: 'transparent',
    border: 'none',
    color: theme.palette.grey[500],
    fontSize: 12.5,
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'underline',
    '&:hover': {
      color: theme.palette.grey[700],
    },
  },
  setupCard: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    borderRadius: 8,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: theme.palette.boxShadow.default,
  },
  setupCardLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[800],
    marginBottom: 2,
  },
  setupCardDescription: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginBottom: 12,
  },
  setupCardRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  textInput: researchPlainTextInputStyles(theme),
  inlineError: {
    fontSize: 12,
    color: theme.palette.error.main,
    marginTop: 4,
  },
}));

const projectListItemStyles = defineStyles('ResearchProjectListItem', (theme: ThemeType) => ({
  item: {
    padding: '12px 16px',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.05)}`,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': {
      background: theme.palette.greyAlpha(0.03),
    },
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
  },
  itemDescription: {
    fontSize: 13,
    color: theme.palette.grey[500],
    marginTop: 2,
    lineHeight: 1.4,
  },
}));

const TOKEN_HINT = 'Run `claude setup-token` locally and paste the result.';

const ResearchProjectList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [replacingToken, setReplacingToken] = useState(false);

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

  const tokenIsSet = !!tokenStatusData?.user?.result?.hasClaudeCodeOAuthToken;

  const handleTokenSaved = useCallback(() => {
    setReplacingToken(false);
    void refetchTokenStatus();
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
      {tokenIsSet && !replacingToken && (
        <ClaudeCodeTokenChip onReplaceClick={() => setReplacingToken(true)} />
      )}
      <div className={classes.panes}>
        <div className={classes.leftPaneInner}>
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
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
            >
              {creating ? 'Creating…' : 'New project'}
            </Button>
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
    </div>
  );
};

function ClaudeCodeTokenChip({ onReplaceClick }: { onReplaceClick: () => void }) {
  const classes = useStyles(claudeCodeTokenStyles);
  return (
    <div className={classes.tokenChipRow}>
      <span className={classes.tokenChip}>
        <span>Claude Code token ✓</span>
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
  onSaved: () => void;
}) {
  const classes = useStyles(claudeCodeTokenStyles);
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
    try {
      await setClaudeCodeOAuthToken({ variables: { token: value } });
      setTokenDraft('');
      onSaved();
    } finally {
      setSaving(false);
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
          <Button
            onClick={() => { onCancel(); setTokenDraft(''); setTokenError(null); }}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving || !tokenDraft.trim()}
        >
          {saving ? 'Saving…' : 'Save token'}
        </Button>
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
  const classes = useStyles(projectListItemStyles);
  return (
    <li className={classes.item} onClick={onOpen}>
      <div className={classes.itemTitle}>{project.title}</div>
      {project.description && (
        <div className={classes.itemDescription}>{project.description}</div>
      )}
    </li>
  );
}

export default ResearchProjectList;
