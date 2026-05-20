"use client";

import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { useForm } from '@tanstack/react-form';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation } from '@apollo/client/react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { MuiTextField } from '@/components/form-components/MuiTextField';
import { FormComponentSelect } from '@/components/form-components/FormComponentSelect';
import { useFormErrors } from '@/components/tanstack-form-components/BaseAppForm';
import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';
import { parseRepoUrl } from '@/lib/research/repoUrl';

const SUPPORTED_RUNTIMES = new TupleSet([
  'node22', 'node24', 'node26', 'python3.13',
] as const);
type Runtime = UnionOf<typeof SUPPORTED_RUNTIMES>;

const RUNTIME_OPTIONS = Array.from(SUPPORTED_RUNTIMES).map((r) => ({ label: r, value: r }));

export interface WorkspaceRepoFormValues {
  repoUrl: string;
  githubToken: string;
  defaultBranch: string;
  runtime: Runtime;
  lockfilePath: string;
  installCommand: string;
  prepareCommand: string;
  devCommand: string;
}

const EMPTY_VALUES: WorkspaceRepoFormValues = {
  repoUrl: '',
  githubToken: '',
  defaultBranch: '',
  runtime: 'node24',
  lockfilePath: '',
  installCommand: '',
  prepareCommand: '',
  devCommand: '',
};

const ProposeWorkspaceRepoConfigMutation = gql(`
  mutation ProposeWorkspaceRepoConfig($repoUrl: String!, $githubToken: String) {
    proposeWorkspaceRepoConfig(repoUrl: $repoUrl, githubToken: $githubToken) {
      defaultBranch
      runtime
      lockfilePath
      installCommand
      prepareCommand
      devCommand
    }
  }
`);

const CreateWorkspaceRepoMutation = gql(`
  mutation CreateWorkspaceRepo($data: CreateWorkspaceRepoDataInput!) {
    createWorkspaceRepo(data: $data) {
      data {
        _id
        host
        owner
        name
        defaultBranch
        runtime
        lockfilePath
        installCommand
        prepareCommand
        devCommand
        createdAt
      }
    }
  }
`);

const styles = defineStyles('WorkspaceRepoForm', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.grey[900],
    margin: '0 0 4px',
  },
  sectionHint: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginBottom: 8,
  },
  fieldWrapper: {
    margin: '8px 0',
  },
  connectActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  actionHint: {
    fontSize: 12,
    color: theme.palette.grey[500],
    lineHeight: 1.4,
  },
  configSection: {
    paddingTop: 12,
    marginTop: 12,
    borderTop: `1px solid ${theme.palette.greyAlpha(0.08)}`,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${theme.palette.greyAlpha(0.06)}`,
  },
  savingStatus: {
    fontSize: 12,
    color: theme.palette.grey[500],
    marginRight: 'auto',
    fontStyle: 'italic',
  },
}));

function asRuntime(value: string | null | undefined): Runtime {
  if (SUPPORTED_RUNTIMES.has(value ?? '')) return value as Runtime;
  return 'node24';
}

function canCreateRepo(values: WorkspaceRepoFormValues, reconfigure: boolean): boolean {
  if (!reconfigure && !values.repoUrl.trim()) return false;
  return !!(values.defaultBranch.trim() && values.lockfilePath.trim() && values.installCommand.trim());
}

export interface WorkspaceRepoFormProps {
  initialValues?: Partial<WorkspaceRepoFormValues>;
  /** Submits via `createWorkspaceRepo`; `WorkspaceRepos` is immutable, so reconfiguring inserts a new revision row. */
  reconfigure?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

const WorkspaceRepoForm = ({ initialValues, reconfigure, onCancel, onSaved }: WorkspaceRepoFormProps) => {
  const classes = useStyles(styles);
  const [proposing, setProposing] = useState(false);

  const { setCaughtError, displayedErrorComponent } = useFormErrors();

  const [proposeConfig] = useMutation(ProposeWorkspaceRepoConfigMutation);
  const [createRepo] = useMutation(CreateWorkspaceRepoMutation);

  const defaultValues = useMemo((): WorkspaceRepoFormValues => ({
    ...EMPTY_VALUES,
    ...initialValues,
    runtime: asRuntime(initialValues?.runtime),
  }), [initialValues]);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ formApi }) => {
      const v = formApi.state.values;
      let parsed;
      try {
        parsed = parseRepoUrl(v.repoUrl);
      } catch (err) {
        setCaughtError(err);
        return;
      }
      try {
        await createRepo({
          variables: {
            data: {
              host: parsed.host,
              owner: parsed.owner,
              name: parsed.name,
              defaultBranch: v.defaultBranch.trim(),
              runtime: v.runtime,
              lockfilePath: v.lockfilePath.trim(),
              installCommand: v.installCommand.trim(),
              prepareCommand: v.prepareCommand.trim() || null,
              devCommand: v.devCommand.trim() || null,
            },
          },
        });
        onSaved();
      } catch (err) {
        setCaughtError(err);
      }
    },
  });

  const handlePropose = async () => {
    const repoUrl = form.state.values.repoUrl.trim();
    const githubToken = form.state.values.githubToken.trim();
    if (!repoUrl || proposing) return;
    setProposing(true);
    try {
      const result = await proposeConfig({
        variables: { repoUrl, githubToken: githubToken || null },
      });
      const proposal = result.data?.proposeWorkspaceRepoConfig;
      if (!proposal) {
        setCaughtError(new Error('The configuration agent returned no proposal — fill the form in by hand.'));
        return;
      }
      // Use setFieldValue rather than reset: reset clears isTouched, and TanStack
      // Form's per-render update(defaultValues) then overwrites values with the
      // initial empty defaults when the form is no longer touched.
      form.setFieldValue('defaultBranch', proposal.defaultBranch ?? '');
      form.setFieldValue('runtime', asRuntime(proposal.runtime));
      form.setFieldValue('lockfilePath', proposal.lockfilePath ?? '');
      form.setFieldValue('installCommand', proposal.installCommand ?? '');
      form.setFieldValue('prepareCommand', proposal.prepareCommand ?? '');
      form.setFieldValue('devCommand', proposal.devCommand ?? '');
    } catch (err) {
      setCaughtError(err);
    } finally {
      setProposing(false);
    }
  };

  return (
    <form
      className={classes.root}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {displayedErrorComponent}

      {!reconfigure && (
        <>
          <h3 className={classes.sectionHeading}>Connect repository</h3>
          <div className={classes.sectionHint}>
            Paste a Git URL. Propose configuration uses an agent to examine the repo and fill in the rest of the configuration.
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="repoUrl">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="Repo URL"
                  placeholder="https://github.com/owner/name"
                  fullWidth
                />
              )}
            </form.Field>
          </div>

          <div className={classes.fieldWrapper}>
            <form.Field name="githubToken">
              {(field) => (
                <MuiTextField
                  field={field}
                  label="GitHub token (for private repos)"
                  placeholder="Optional; stored as a repo-scoped GITHUB_TOKEN"
                  fullWidth
                />
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(s) => s.values.repoUrl}>
            {(repoUrl) => (
              <div className={classes.connectActions}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePropose}
                  disabled={proposing || !repoUrl.trim()}
                >
                  {proposing ? 'Inferring configuration…' : 'Propose configuration'}
                </Button>
                {proposing ? (
                  <div className={classes.actionHint}>Reading the repo and inferring install / dev commands…</div>
                ) : repoUrl.trim() ? (
                  <div className={classes.actionHint}>Recommended first step — review the fields below before creating.</div>
                ) : null}
              </div>
            )}
          </form.Subscribe>
        </>
      )}

      <div className={classNames({ [classes.configSection]: !reconfigure })}>
        <h3 className={classes.sectionHeading}>
          {reconfigure ? 'Configuration' : 'Review configuration'}
        </h3>
        {!reconfigure && (
          <div className={classes.sectionHint}>
            Filled in automatically after proposing, or enter manually.
          </div>
        )}

      {reconfigure && (
        <div className={classes.fieldWrapper}>
          <form.Field name="repoUrl">
            {(field) => (
              <MuiTextField
                field={field}
                label="Repo URL"
                placeholder="https://github.com/owner/name"
                fullWidth
                disabled
              />
            )}
          </form.Field>
        </div>
      )}

      <div className={classes.fieldWrapper}>
        <form.Field name="defaultBranch">
          {(field) => <MuiTextField field={field} label="Default branch" placeholder="main" fullWidth />}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="runtime">
          {(field) => (
            <FormComponentSelect
              field={field}
              options={RUNTIME_OPTIONS}
              label="Runtime"
              hideClear
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="lockfilePath">
          {(field) => (
            <MuiTextField
              field={field}
              label="Lockfile path"
              placeholder="yarn.lock"
              fullWidth
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="installCommand">
          {(field) => (
            <MuiTextField
              field={field}
              label="Install command"
              placeholder="corepack enable && yarn install --immutable"
              fullWidth
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="prepareCommand">
          {(field) => (
            <MuiTextField
              field={field}
              label="Prepare command (optional)"
              placeholder="Run once on first provision, after install"
              fullWidth
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="devCommand">
          {(field) => (
            <MuiTextField
              field={field}
              label="Dev command (optional)"
              placeholder="vite --port $PORT"
              fullWidth
            />
          )}
        </form.Field>
      </div>
      </div>

      <form.Subscribe
        selector={(s) => ({
          isSubmitting: s.isSubmitting,
          values: s.values,
        })}
      >
        {({ isSubmitting, values }) => {
          const canCreate = canCreateRepo(values, !!reconfigure);

          return (
            <div className={classes.buttonRow}>
              {isSubmitting && (
                <span className={classes.savingStatus}>
                  Building install-cache snapshot — this can take a few minutes…
                </span>
              )}
              <Button onClick={onCancel} disabled={isSubmitting || proposing}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!canCreate || isSubmitting || proposing}
              >
                {isSubmitting ? 'Saving…' : reconfigure ? 'Save new revision' : 'Create repo'}
              </Button>
            </div>
          );
        }}
      </form.Subscribe>
    </form>
  );
};

export default WorkspaceRepoForm;
