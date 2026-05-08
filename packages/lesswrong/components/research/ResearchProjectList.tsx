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

interface ResearchProjectSummary {
  _id: string;
  title: string;
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

const CreateResearchProjectMutation = gql(`
  mutation CreateResearchProject($title: String!, $description: String, $claudeCodeTokenRef: String) {
    createResearchProject(data: { title: $title, description: $description, claudeCodeTokenRef: $claudeCodeTokenRef }) {
      data {
        _id
        title
        description
        createdAt
      }
    }
  }
`);

const UpdateResearchProjectTokenMutation = gql(`
  mutation UpdateResearchProjectToken($selector: SelectorInput!, $data: UpdateResearchProjectDataInput!) {
    updateResearchProject(selector: $selector, data: $data) {
      data {
        _id
      }
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
  secondaryButton: {
    padding: '4px 10px',
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.primary,
    cursor: 'pointer',
    fontSize: 12,
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
  itemTokenForm: {
    marginTop: 12,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: theme.palette.text.dim,
  },
}));

const TOKEN_HINT = "Run `claude setup-token` locally and paste the result.";

const ResearchProjectList = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newToken, setNewToken] = useState('');
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
          claudeCodeTokenRef: newToken.trim() || null,
        },
      });
      const created = result.data?.createResearchProject?.data;
      if (created) {
        setNewTitle('');
        setNewDescription('');
        setNewToken('');
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
        <div className={classes.newProjectForm}>
          <div className={classes.newProjectFormRow}>
            <input
              className={classes.input}
              placeholder="Project title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={creating}
            />
            <input
              className={classes.input}
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className={classes.newProjectFormRow}>
            <input
              className={classes.input}
              type="password"
              placeholder="Claude Code OAuth token"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              disabled={creating}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className={classes.button}
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
            >
              New project
            </button>
          </div>
          <div className={classes.inputHint}>{TOKEN_HINT}</div>
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

interface ProjectListItemClasses {
  item: string;
  itemHeader: string;
  itemBody: string;
  itemTitle: string;
  itemDescription: string;
  itemTokenForm: string;
  input: string;
  button: string;
  secondaryButton: string;
  inputHint: string;
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
  const [editingToken, setEditingToken] = useState(false);
  const [tokenDraft, setTokenDraft] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [updateToken] = useMutation(UpdateResearchProjectTokenMutation);

  const handleSaveToken = async () => {
    const value = tokenDraft.trim();
    if (!value || savingToken) return;
    setSavingToken(true);
    try {
      await updateToken({
        variables: {
          selector: { _id: project._id },
          data: { claudeCodeTokenRef: value },
        },
      });
      setTokenDraft('');
      setEditingToken(false);
      setSavedAt(Date.now());
    } finally {
      setSavingToken(false);
    }
  };

  return (
    <li className={classes.item}>
      <div className={classes.itemHeader}>
        <div className={classes.itemBody} onClick={onOpen}>
          <div className={classes.itemTitle}>{project.title}</div>
          {project.description ? (
            <div className={classes.itemDescription}>{project.description}</div>
          ) : null}
        </div>
        <button
          className={classes.secondaryButton}
          onClick={(e) => {
            e.stopPropagation();
            setEditingToken((v) => !v);
          }}
        >
          {editingToken ? 'Cancel' : savedAt ? 'Token saved ✓' : 'Set / replace token'}
        </button>
      </div>
      {editingToken ? (
        <div className={classes.itemTokenForm} onClick={(e) => e.stopPropagation()}>
          <input
            className={classes.input}
            type="password"
            placeholder="Claude Code OAuth token"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
            disabled={savingToken}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <button
            className={classes.button}
            onClick={handleSaveToken}
            disabled={savingToken || !tokenDraft.trim()}
          >
            Save
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default ResearchProjectList;
