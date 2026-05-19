"use client";

import React, { useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useNavigate } from '@/lib/routeUtil';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import Loading from '../vulcan-core/Loading';
import { CLAUDE_CODE_OAUTH_TOKEN_SECRET } from '@/lib/collections/userSecrets/userSecretNames';

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

const ResearchUserSecretsQuery = gql(`
  query ResearchUserSecretsQuery {
    userSecrets(selector: { mySecrets: {} }, limit: 200) {
      results {
        _id
        name
        repoScope
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

const CreateUserSecretMutation = gql(`
  mutation ResearchCreateUserSecret($name: String!, $value: String!) {
    createUserSecret(data: { name: $name, value: $value }) {
      data { _id name }
    }
  }
`);

const UpdateUserSecretMutation = gql(`
  mutation ResearchUpdateUserSecret($_id: String!, $value: String!) {
    updateUserSecret(selector: { _id: $_id }, data: { value: $value }) {
      data { _id name }
    }
  }
`);

const styles = defineStyles('ResearchProjectList', (theme: ThemeType) => ({
  root: {
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  newProjectForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 24,
    padding: 16,
    background: theme.palette.greyAlpha(0.04),
    borderRadius: 4,
  },
  newProjectFormRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    fontFamily: 'inherit',
    fontSize: 14,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    // Restate the border in `:focus` so it isn't stripped by the
    // `input:focus` global rule in `globalStyles.ts:33`. Without this,
    // focusing the input loses its border and the layout shifts by 2px.
    "&:focus": {
      border: theme.palette.greyBorder('1px', 0.2),
    },
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.dim,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: theme.palette.text.dim,
    marginTop: 2,
  },
  inputError: {
    fontSize: 11,
    color: theme.palette.error.main,
    marginTop: 2,
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    padding: '16px 20px',
    borderBottom: theme.palette.greyBorder('1px', 0.1),
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemBody: {
    flex: 1,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.85,
    },
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
    color: theme.palette.text.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.palette.text.dim,
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: theme.palette.text.dim,
  },
}));

const TOKEN_HINT = "Run `claude setup-token` locally and paste the result.";

// Catches stray whitespace (incl. newlines) anywhere in a token after trimming
// leading/trailing — typically from a copy-paste that grabbed a line break.
function tokenWhitespaceError(token: string): string | null {
  if (/\s/.test(token.trim())) {
    return 'Token contains whitespace; copy without spaces or newlines.';
  }
  return null;
}

const ResearchProjectList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const { data, loading, refetch } = useQuery(ResearchProjectsListQuery, {
    fetchPolicy: 'cache-and-network',
  });

  const [createProject] = useMutation(CreateResearchProjectMutation);

  if (!currentUser) {
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
    <SingleColumnSection>
      <div className={classes.root}>
        <div className={classes.header}>
          <SectionTitle title="Research Projects" />
        </div>
        <ClaudeCodeTokenForm classes={classes} />
        <div className={classes.newProjectForm}>
          <div className={classes.newProjectFormRow}>
            <input
              className={classes.input}
              name="research-project-title"
              placeholder="Project title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={creating}
              autoComplete="off"
            />
            <input
              className={classes.input}
              name="research-project-description"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              disabled={creating}
              autoComplete="off"
            />
            <button
              className={classes.button}
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
            >
              New project
            </button>
          </div>
        </div>
        {loading && projects.length === 0 ? <Loading /> : null}
        {!loading && projects.length === 0 ? (
          <div className={classes.empty}>No research projects yet — create one above to get started.</div>
        ) : null}
        <ul className={classes.list}>
          {projects.map((project) => (
            <ProjectListItem
              key={project._id}
              project={project}
              classes={classes}
              onOpen={() => navigate(`/research/projects/${project._id}`)}
            />
          ))}
        </ul>
      </div>
    </SingleColumnSection>
  );
};

interface TokenFormClasses {
  newProjectForm: string;
  newProjectFormRow: string;
  inputLabel: string;
  input: string;
  button: string;
  inputHint: string;
  inputError: string;
}

/**
 * The Claude Code OAuth token is a single user-global secret (not per-project),
 * stored in `UserSecrets`. This form sets or replaces it.
 */
function ClaudeCodeTokenForm({ classes }: { classes: TokenFormClasses }) {
  const [tokenDraft, setTokenDraft] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, refetch } = useQuery(ResearchUserSecretsQuery, {
    fetchPolicy: 'cache-and-network',
  });
  const [createUserSecret] = useMutation(CreateUserSecretMutation);
  const [updateUserSecret] = useMutation(UpdateUserSecretMutation);

  const existingTokenSecret = (data?.userSecrets?.results ?? []).find(
    (secret) => secret.name === CLAUDE_CODE_OAUTH_TOKEN_SECRET && !secret.repoScope,
  );
  const tokenIsSet = !!existingTokenSecret;

  const handleSave = async () => {
    const value = tokenDraft.trim();
    if (!value || saving) return;
    const error = tokenWhitespaceError(tokenDraft);
    if (error) {
      setTokenError(error);
      return;
    }
    setTokenError(null);
    setSaving(true);
    try {
      if (existingTokenSecret) {
        await updateUserSecret({ variables: { _id: existingTokenSecret._id, value } });
      } else {
        await createUserSecret({ variables: { name: CLAUDE_CODE_OAUTH_TOKEN_SECRET, value } });
      }
      setTokenDraft('');
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.newProjectForm}>
      <div className={classes.inputLabel}>
        {tokenIsSet ? 'Claude Code token — set ✓' : 'Claude Code token — not set'}
      </div>
      <div className={classes.newProjectFormRow}>
        <input
          className={classes.input}
          type="password"
          name="research-claude-token"
          placeholder={tokenIsSet ? 'Replace Claude Code OAuth token' : 'Claude Code OAuth token'}
          value={tokenDraft}
          onChange={(e) => {
            setTokenDraft(e.target.value);
            if (tokenError) setTokenError(null);
          }}
          disabled={saving}
          autoComplete="new-password"
          spellCheck={false}
        />
        <button
          className={classes.button}
          onClick={handleSave}
          disabled={saving || !tokenDraft.trim()}
        >
          Save token
        </button>
      </div>
      {tokenError
        ? <div className={classes.inputError}>{tokenError}</div>
        : <div className={classes.inputHint}>{TOKEN_HINT}</div>}
    </div>
  );
}

interface ProjectListItemClasses {
  item: string;
  itemHeader: string;
  itemBody: string;
  itemTitle: string;
  itemDescription: string;
}

function ProjectListItem({
  project,
  classes,
  onOpen,
}: {
  project: ResearchProjectSummary;
  classes: ProjectListItemClasses;
  onOpen: () => void;
}) {
  return (
    <li className={classes.item}>
      <div className={classes.itemHeader}>
        <div className={classes.itemBody} onClick={onOpen}>
          <div className={classes.itemTitle}>{project.title}</div>
          {project.description ? (
            <div className={classes.itemDescription}>{project.description}</div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default ResearchProjectList;
