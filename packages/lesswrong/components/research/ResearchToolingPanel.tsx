"use client";

import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useForm } from '@tanstack/react-form';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import Loading from '../vulcan-core/Loading';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { repoScopeOf } from '@/lib/research/repoUrl';
import WorkspaceRepoForm, { WorkspaceRepoFormValues } from './WorkspaceRepoForm';
import { CurrentWorkspaceReposQuery } from './currentWorkspaceReposQuery';

const ResearchToolingUserSecretsQuery = gql(`
  query ResearchToolingUserSecretsQuery {
    userSecrets(selector: { mySecrets: {} }, limit: 500) {
      results {
        _id
        name
        repoScope
      }
    }
  }
`);

const ToolingCreateUserSecretMutation = gql(`
  mutation ToolingCreateUserSecret($data: CreateUserSecretDataInput!) {
    createUserSecret(data: $data) {
      data { _id name repoScope }
    }
  }
`);

const ToolingUpdateUserSecretMutation = gql(`
  mutation ToolingUpdateUserSecret($selector: SelectorInput!, $data: UpdateUserSecretDataInput!) {
    updateUserSecret(selector: $selector, data: $data) {
      data { _id name repoScope }
    }
  }
`);

const ToolingDeleteUserSecretMutation = gql(`
  mutation ToolingDeleteUserSecret($_id: String!) {
    deleteUserSecret(_id: $_id) { success }
  }
`);

const SECRET_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const GLOBAL_SCOPE_VALUE = '__global__';

const styles = defineStyles('ResearchToolingPanel', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    '&:not(:first-child) $sectionHeader': {
      borderTop: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    textAlign: 'left',
    '&:hover': {
      background: theme.palette.greyAlpha(0.02),
    },
  },
  sectionHeaderIcon: {
    '--icon-size': '12px',
    display: 'inline-flex',
    color: theme.palette.grey[500],
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.grey[800],
  },
  sectionCount: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyRow: {
    padding: '12px 16px',
    fontSize: 13,
    color: theme.palette.grey[500],
  },
  loadingRow: {
    padding: 14,
  },
  bodyRow: {
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.05)}`,
    '&:last-child': { borderBottom: 'none' },
  },
  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    color: theme.palette.primary.main,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    '&:hover': {
      background: theme.palette.greyAlpha(0.03),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  addRowIcon: {
    '--icon-size': '14px',
    display: 'inline-flex',
  },
  inlineFormCell: {
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.05)}`,
  },
  repoRowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    textAlign: 'left',
    color: theme.palette.grey[800],
    '&:hover': {
      background: theme.palette.greyAlpha(0.03),
    },
  },
  repoRowHeaderActive: {
    background: theme.palette.greyAlpha(0.03),
  },
  repoRowIcon: {
    '--icon-size': '12px',
    color: theme.palette.grey[500],
    flexShrink: 0,
  },
  repoLabel: {
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  repoBranchChip: {
    fontSize: 12,
    color: theme.palette.grey[500],
    fontFamily: 'monospace',
  },
  repoExpanded: {
    padding: '4px 16px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  configList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  configRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  configLabel: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    lineHeight: 1.4,
  },
  configValue: {
    fontSize: 13,
    color: theme.palette.grey[900],
    fontFamily: 'monospace',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },
  configValueMuted: {
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily,
  },
  subheading: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[800],
    marginBottom: 4,
  },
  secretChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  secretChip: {
    padding: '2px 8px',
    borderRadius: 12,
    background: theme.palette.greyAlpha(0.06),
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.palette.grey[800],
  },
  secretChipsEmpty: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
  },
  expandedActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  addSecretCell: {
    padding: '4px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  addSecretFields: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto',
    gap: 10,
    alignItems: 'center',
  },
  addSecretField: {
    minWidth: 0,
    width: '100%',
  },
  addSecretButtonCell: {
    flexShrink: 0,
    alignSelf: 'flex-end',
    paddingBottom: 6,
  },
  scopeHeader: {
    padding: '8px 16px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.grey[500],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  scopeHeaderRepo: {
    fontFamily: 'monospace',
    fontWeight: 500,
    textTransform: 'none' as const,
    letterSpacing: 0,
    color: theme.palette.grey[700],
    fontSize: 12,
  },
  secretRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 16px',
  },
  secretName: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: theme.palette.grey[900],
    flex: '0 1 220px',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  secretGap: {
    flex: 1,
  },
  secretActions: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  secretEditField: {
    flex: 1,
    minWidth: 0,
  },
  inlineError: {
    color: theme.palette.error.main,
    fontSize: 12,
    padding: '0 16px 8px 16px',
  },
}));

interface RepoFormState {
  kind: 'add' | 'reconfigure';
  repoId?: string;
}

export interface ResearchToolingPanelProps {
  /** Called when a repo form opens or closes so the parent can widen this pane and show a scrim. */
  onFormStateChange: (formOpen: boolean) => void;
  /**
   * Monotonically-incremented counter the parent bumps when it wants the
   * tooling panel to close any open form (e.g., scrim click). Watched via
   * `useEffect`; ignores the initial mount.
   */
  closeFormSignal: number;
}

type CompleteWorkspaceRepo = WorkspaceRepo & {
  host: string;
  owner: string;
  name: string;
};

type SecretSummary = Pick<UserSecret, '_id' | 'name' | 'repoScope'>;

const ResearchToolingPanel = ({ onFormStateChange, closeFormSignal }: ResearchToolingPanelProps) => {
  const classes = useStyles(styles);
  const [reposCollapsed, setReposCollapsed] = useState(false);
  const [secretsCollapsed, setSecretsCollapsed] = useState(false);
  const [expandedRepoId, setExpandedRepoId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RepoFormState | null>(null);

  useEffect(() => {
    if (closeFormSignal === 0) return;
    setFormState((prev) => {
      if (prev === null) return prev;
      onFormStateChange(false);
      return null;
    });
  }, [closeFormSignal, onFormStateChange]);

  const {
    data: reposData,
    loading: reposLoading,
    refetch: refetchRepos,
  } = useQuery(CurrentWorkspaceReposQuery, { fetchPolicy: 'cache-and-network' });

  const {
    data: secretsData,
    loading: secretsLoading,
    refetch: refetchSecrets,
  } = useQuery(ResearchToolingUserSecretsQuery, { fetchPolicy: 'cache-and-network' });

  const repos: CompleteWorkspaceRepo[] = useMemo(() => {
    const rows = reposData?.currentWorkspaceRepos ?? [];
    return rows
      .filter((r): r is typeof r & { host: string; owner: string; name: string } => !!r.host && !!r.owner && !!r.name)
      .sort((a, b) => `${a.owner}/${a.name}`.localeCompare(`${b.owner}/${b.name}`));
  }, [reposData]);

  const secrets: SecretSummary[] = useMemo(
    () => secretsData?.userSecrets?.results ?? [],
    [secretsData],
  );

  const openForm = (next: RepoFormState) => {
    setFormState(next);
    onFormStateChange(true);
  };
  const closeForm = () => {
    setFormState(null);
    onFormStateChange(false);
  };
  const handleSavedRepo = () => {
    closeForm();
    void refetchRepos();
  };

  const repoFormInitialValues: Partial<WorkspaceRepoFormValues> | undefined = useMemo(() => {
    if (formState?.kind !== 'reconfigure') return undefined;
    const repo = repos.find((r) => r._id === formState.repoId);
    if (!repo) return undefined;
    return {
      repoUrl: `https://${repo.host}/${repo.owner}/${repo.name}`,
      defaultBranch: repo.defaultBranch ?? '',
      runtime: (repo.runtime ?? 'node24') as WorkspaceRepoFormValues['runtime'],
      lockfilePath: repo.lockfilePath ?? '',
      installCommand: repo.installCommand ?? '',
      prepareCommand: repo.prepareCommand ?? '',
      devCommand: repo.devCommand ?? '',
    };
  }, [formState, repos]);

  const repoScopes = useMemo(() => repos.map(repoScopeOf), [repos]);
  const grouped = useMemo(() => groupSecrets(secrets, repoScopes), [secrets, repoScopes]);

  const reposExpanded = !reposCollapsed;
  const secretsExpanded = !secretsCollapsed;

  return (
    <div className={classes.root}>
      <section className={classes.section}>
        <SectionHeader
          title="Repos"
          count={repos.length}
          expanded={reposExpanded}
          onToggle={() => setReposCollapsed((c) => !c)}
        />
        {reposExpanded && (
          <div className={classes.sectionBody}>
            {formState?.kind === 'add' ? (
              <div className={classes.inlineFormCell}>
                <WorkspaceRepoForm onCancel={closeForm} onSaved={handleSavedRepo} />
              </div>
            ) : (
              <button
                type="button"
                className={classes.addRow}
                onClick={() => openForm({ kind: 'add' })}
                disabled={formState !== null}
              >
                <ForumIcon icon="Plus" className={classes.addRowIcon} />
                Add repo
              </button>
            )}
            {reposLoading && repos.length === 0 ? (
              <div className={classes.loadingRow}><Loading /></div>
            ) : null}
            {repos.map((repo) => {
              const isExpanded = expandedRepoId === repo._id;
              const isReconfiguring = formState?.kind === 'reconfigure' && formState.repoId === repo._id;
              const repoSecrets = grouped.byScope.get(repoScopeOf(repo)) ?? [];
              const showExpanded = isExpanded || isReconfiguring;
              return (
                <RepoRow
                  key={repo._id}
                  repo={repo}
                  isReconfiguring={isReconfiguring}
                  showExpanded={showExpanded}
                  formActive={formState !== null}
                  repoSecrets={repoSecrets}
                  initialValues={repoFormInitialValues}
                  onToggle={() => setExpandedRepoId(isExpanded ? null : repo._id)}
                  onReconfigure={() => openForm({ kind: 'reconfigure', repoId: repo._id })}
                  onCancelForm={closeForm}
                  onSavedForm={handleSavedRepo}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className={classes.section}>
        <SectionHeader
          title="Secrets"
          count={secrets.length}
          expanded={secretsExpanded}
          onToggle={() => setSecretsCollapsed((c) => !c)}
        />
        {secretsExpanded && (
          <div className={classes.sectionBody}>
            <AddSecretComposer
              repoScopes={repoScopes}
              onCreated={() => { void refetchSecrets(); }}
            />
            {secretsLoading && secrets.length === 0 ? (
              <div className={classes.loadingRow}><Loading /></div>
            ) : null}
            <SecretsList
              grouped={grouped}
              repoScopes={repoScopes}
              onChanged={() => { void refetchSecrets(); }}
            />
          </div>
        )}
      </section>
    </div>
  );
};

function SectionHeader({
  title,
  count,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const classes = useStyles(styles);
  return (
    <button type="button" className={classes.sectionHeader} onClick={onToggle}>
      <ForumIcon
        icon={expanded ? 'ThickChevronDown' : 'ThickChevronRight'}
        className={classes.sectionHeaderIcon}
      />
      <span className={classes.sectionTitle}>{title}</span>
      {count > 0 && <span className={classes.sectionCount}>{count}</span>}
    </button>
  );
}

function RepoRow({
  repo,
  isReconfiguring,
  showExpanded,
  formActive,
  repoSecrets,
  initialValues,
  onToggle,
  onReconfigure,
  onCancelForm,
  onSavedForm,
}: {
  repo: CompleteWorkspaceRepo;
  isReconfiguring: boolean;
  showExpanded: boolean;
  formActive: boolean;
  repoSecrets: SecretSummary[];
  initialValues: Partial<WorkspaceRepoFormValues> | undefined;
  onToggle: () => void;
  onReconfigure: () => void;
  onCancelForm: () => void;
  onSavedForm: () => void;
}) {
  const classes = useStyles(styles);
  return (
    <div className={classes.bodyRow}>
      <button
        type="button"
        className={classNames(classes.repoRowHeader, {
          [classes.repoRowHeaderActive]: showExpanded,
        })}
        onClick={onToggle}
      >
        <ForumIcon
          icon={showExpanded ? 'ThickChevronDown' : 'ThickChevronRight'}
          className={classes.repoRowIcon}
        />
        <span className={classes.repoLabel}>{repo.owner}/{repo.name}</span>
        <span className={classes.repoBranchChip}>{repo.defaultBranch}</span>
      </button>
      {showExpanded && (
        <div className={classes.repoExpanded}>
          {isReconfiguring ? (
            <WorkspaceRepoForm
              initialValues={initialValues}
              reconfigure
              onCancel={onCancelForm}
              onSaved={onSavedForm}
            />
          ) : (
            <>
              <RepoConfigReadOnly repo={repo} />
              <div>
                <div className={classes.subheading}>Repo secrets</div>
                {repoSecrets.length === 0 ? (
                  <div className={classes.secretChipsEmpty}>
                    None yet — add in Secrets below.
                  </div>
                ) : (
                  <div className={classes.secretChips}>
                    {repoSecrets.map((s) => (
                      <span key={s._id} className={classes.secretChip}>{s.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={classes.expandedActions}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onReconfigure}
                  disabled={formActive}
                >
                  Reconfigure
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RepoConfigReadOnly({ repo }: { repo: CompleteWorkspaceRepo }) {
  const classes = useStyles(styles);
  return (
    <div className={classes.configList}>
      <ConfigItem label="Runtime" value={repo.runtime} />
      <ConfigItem label="Lockfile" value={repo.lockfilePath} />
      <ConfigItem label="Install" value={repo.installCommand} />
      <ConfigItem label="Prepare" value={repo.prepareCommand} />
      <ConfigItem label="Dev" value={repo.devCommand} />
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value?: string | null; }) {
  const classes = useStyles(styles);
  return (
    <div className={classes.configRow}>
      <div className={classes.configLabel}>{label}</div>
      {value
        ? <div className={classes.configValue}>{value}</div>
        : <div className={classes.configValueMuted}>—</div>}
    </div>
  );
}

interface GroupedSecrets {
  global: SecretSummary[];
  byScope: ReadonlyMap<string, SecretSummary[]>;
}

function groupSecrets(secrets: ReadonlyArray<SecretSummary>, repoScopes: ReadonlyArray<string>): GroupedSecrets {
  const global: SecretSummary[] = [];
  const byScope = new Map<string, SecretSummary[]>();
  for (const scope of repoScopes) byScope.set(scope, []);
  for (const secret of secrets) {
    if (!secret.repoScope) {
      global.push(secret);
    } else {
      const arr = byScope.get(secret.repoScope) ?? [];
      arr.push(secret);
      byScope.set(secret.repoScope, arr);
    }
  }
  return { global, byScope };
}

interface AddSecretFormValues {
  name: string;
  value: string;
  /** `GLOBAL_SCOPE_VALUE` for the global scope, or a repo-identity string. */
  scope: string;
}

function AddSecretComposer({
  repoScopes,
  onCreated,
}: {
  repoScopes: string[];
  onCreated: () => void;
}) {
  const classes = useStyles(styles);
  const { setCaughtError, displayedErrorComponent } = useFormErrors();
  const [createSecret] = useMutation(ToolingCreateUserSecretMutation);

  const scopeOptions = useMemo(() => [
    { value: GLOBAL_SCOPE_VALUE, label: 'Global' },
    ...repoScopes.map((s) => ({ value: s, label: s })),
  ], [repoScopes]);

  const form = useForm({
    defaultValues: { name: '', value: '', scope: GLOBAL_SCOPE_VALUE } satisfies AddSecretFormValues,
    onSubmit: async ({ formApi }) => {
      const name = formApi.state.values.name.trim();
      const value = formApi.state.values.value;
      const scope = formApi.state.values.scope === GLOBAL_SCOPE_VALUE
        ? null
        : formApi.state.values.scope;
      if (!name || !value) return;
      try {
        await createSecret({ variables: { data: { name, value, repoScope: scope } } });
        formApi.reset({ name: '', value: '', scope: formApi.state.values.scope });
        onCreated();
      } catch (err) {
        setCaughtError(err);
      }
    },
  });

  return (
    <form
      className={classes.addSecretCell}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {displayedErrorComponent}
      <div className={classes.addSecretFields}>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const trimmed = value.trim();
              if (!trimmed) return undefined;
              if (!SECRET_NAME_PATTERN.test(trimmed)) {
                return 'Use letters, digits, and underscores (must not start with a digit).';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className={classes.addSecretField}>
              <MuiTextField
                field={field}
                label="Name"
                placeholder="SECRET_NAME"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="value">
          {(field) => (
            <div className={classes.addSecretField}>
              <MuiTextField
                field={field}
                label="Value"
                placeholder="secret value"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="scope">
          {(field) => (
            <div className={classes.addSecretField}>
              <FormComponentSelect
                field={field}
                options={scopeOptions}
                label="Scope"
                hideClear
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({
            canSubmit: s.canSubmit,
            isSubmitting: s.isSubmitting,
            name: s.values.name,
            value: s.values.value,
          })}
        >
          {({ canSubmit, isSubmitting, name, value }) => (
            <div className={classes.addSecretButtonCell}>
              <Button
                type="submit"
                size="small"
                variant="contained"
                color="primary"
                disabled={!canSubmit || isSubmitting || !name.trim() || !value}
              >
                {isSubmitting ? 'Adding…' : 'Add secret'}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

function SecretsList({
  grouped,
  repoScopes,
  onChanged,
}: {
  grouped: GroupedSecrets;
  repoScopes: string[];
  onChanged: () => void;
}) {
  const classes = useStyles(styles);
  return (
    <>
      {grouped.global.length > 0 && (
        <>
          <div className={classes.scopeHeader}>Global</div>
          {grouped.global.map((s) => (
            <SecretRow key={s._id} secret={s} onChanged={onChanged} />
          ))}
        </>
      )}
      {repoScopes.map((scope) => {
        const items = grouped.byScope.get(scope) ?? [];
        if (items.length === 0) return null;
        return (
          <React.Fragment key={scope}>
            <div className={classNames(classes.scopeHeader, classes.scopeHeaderRepo)}>{scope}</div>
            {items.map((s) => (
              <SecretRow key={s._id} secret={s} onChanged={onChanged} />
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

interface ReplaceSecretFormValues { value: string; }

function SecretRow({
  secret,
  onChanged,
}: {
  secret: SecretSummary;
  onChanged: () => void;
}) {
  const classes = useStyles(styles);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const [updateSecret] = useMutation(ToolingUpdateUserSecretMutation);
  const [deleteSecret] = useMutation(ToolingDeleteUserSecretMutation);

  const form = useForm({
    defaultValues: { value: '' } satisfies ReplaceSecretFormValues,
    onSubmit: async ({ formApi }) => {
      const value = formApi.state.values.value;
      if (!value) return;
      try {
        await updateSecret({ variables: { selector: { _id: secret._id }, data: { value } } });
        formApi.reset({ value: '' });
        setEditing(false);
        onChanged();
      } catch (err) {
        setCaughtError(err);
      }
    },
  });

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteSecret({ variables: { _id: secret._id } });
      onChanged();
    } catch (err) {
      setCaughtError(err);
    } finally {
      setDeleting(false);
    }
  };

  if (!editing) {
    return (
      <>
        <div className={classes.secretRow}>
          <span className={classes.secretName}>{secret.name}</span>
          <span className={classes.secretGap} />
          <div className={classes.secretActions}>
            <Button size="small" onClick={() => setEditing(true)} disabled={deleting}>
              Replace
            </Button>
            <Button size="small" onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : 'Delete'}
            </Button>
          </div>
        </div>
        {displayedErrorComponent}
      </>
    );
  }

  return (
    <form
      className={classes.secretRow}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <span className={classes.secretName}>{secret.name}</span>
      <div className={classes.secretEditField}>
        <form.Field name="value">
          {(field) => (
            <MuiTextField
              field={field}
              placeholder="new value"
              fullWidth
            />
          )}
        </form.Field>
      </div>
      <form.Subscribe
        selector={(s) => ({
          canSubmit: s.canSubmit,
          isSubmitting: s.isSubmitting,
          value: s.values.value,
        })}
      >
        {({ canSubmit, isSubmitting, value }) => (
          <div className={classes.secretActions}>
            <Button
              size="small"
              onClick={() => { setEditing(false); form.reset({ value: '' }); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              color="primary"
              disabled={!canSubmit || isSubmitting || !value}
            >
              {isSubmitting ? '…' : 'Save'}
            </Button>
          </div>
        )}
      </form.Subscribe>
      {displayedErrorComponent && <div className={classes.inlineError}>{displayedErrorComponent}</div>}
    </form>
  );
}

export default ResearchToolingPanel;
