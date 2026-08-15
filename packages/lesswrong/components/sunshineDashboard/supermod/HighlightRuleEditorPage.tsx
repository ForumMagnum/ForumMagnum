"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import classNames from 'classnames';
import jsonStringifyDeterministic from 'json-stringify-deterministic';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import ErrorAccessDenied from '@/components/common/ErrorAccessDenied';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import SectionTitle from '@/components/common/SectionTitle';
import Loading from '@/components/vulcan-core/Loading';
import {
  emptyHighlightRuleOverrides,
  parseHighlightRuleOverrides,
  type HighlightRule,
  type HighlightRuleCategory,
  type HighlightRuleOverrides,
} from '@/lib/moderatorHighlights/highlightRuleTypes';
import {
  DEFAULT_ACTION_HIGHLIGHT_RULES,
  highlightableModeratorActions,
  moderatorActionHighlightColors,
  moderatorActionHighlightLabels,
} from './actionHighlightRules';
import {
  DEFAULT_MESSAGE_TEMPLATE_RULES,
  DEFAULT_REJECTION_TEMPLATE_RULES,
  codeDefinedMessageTemplateRuleNames,
  codeDefinedRejectionTemplateRuleNames,
} from './templateHighlightRules';
import HighlightRuleEditor, { type SignalScope } from './HighlightRuleEditor';
import { SupermodHighlightRuleOverridesQuery } from './useHighlightRuleOverrides';

const SetSupermodHighlightRuleOverridesMutation = gql(`
  mutation setSupermodHighlightRuleOverrides($overrides: JSON!) {
    setSupermodHighlightRuleOverrides(overrides: $overrides)
  }
`);

const ModerationTemplateNamesQuery = gql(`
  query moderationTemplateNamesForHighlightRules($selector: ModerationTemplateSelector, $limit: Int) {
    moderationTemplates(selector: $selector, limit: $limit) {
      results {
        _id
        name
        collectionName
      }
    }
  }
`);

const styles = defineStyles('HighlightRuleEditorPage', (theme: ThemeType) => ({
  intro: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    marginBottom: 16,
  },
  saveBar: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
    marginBottom: 12,
    background: theme.palette.background.pageActiveAreaBackground,
    borderBottom: theme.palette.border.faint,
  },
  saveButton: {
    ...theme.typography.body2,
    padding: '4px 12px',
    borderRadius: 3,
    border: 'none',
    cursor: 'pointer',
    background: theme.palette.primary.main,
    color: theme.palette.text.invertedBackgroundText,
    '&:disabled': {
      opacity: 0.4,
      cursor: 'default',
    },
  },
  discardButton: {
    ...theme.typography.body2,
    background: 'none',
    border: 'none',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.4,
      cursor: 'default',
    },
  },
  saveStatus: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  errorStatus: {
    color: theme.palette.error.main,
  },
  addRuleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  addRuleLabel: {
    ...theme.typography.body2,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  addRuleSelect: {
    ...theme.typography.body2,
    fontSize: 13,
    maxWidth: 360,
    padding: 3,
  },
  codeRules: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 32,
    lineHeight: 1.6,
  },
  codeRuleName: {
    fontWeight: 600,
  },
}));

interface RuleSectionEntry {
  key: string;
  title: string;
  description?: string;
  warning?: string;
}

function getActionEntries(): RuleSectionEntry[] {
  return highlightableModeratorActions.map(action => ({
    key: action,
    title: moderatorActionHighlightLabels[action],
    description: `Level 2 outline color: ${moderatorActionHighlightColors[action]}`,
  }));
}

/** Rules the editor shows for a template category: the code defaults, plus anything added by hand */
function getTemplateEntries(
  defaults: Record<string, HighlightRule>,
  categoryOverrides: Record<string, HighlightRule>,
  existingTemplateNames: string[],
  templatesLoaded: boolean,
): RuleSectionEntry[] {
  const keys = [...new Set([...Object.keys(defaults), ...Object.keys(categoryOverrides)])];
  return keys.map(key => ({
    key,
    title: key,
    // Rules are matched to templates by name, so a renamed template silently stops highlighting
    warning: templatesLoaded && !existingTemplateNames.includes(key) ? "No template with this name" : undefined,
  }));
}

function getAddRuleOptions(
  defaults: Record<string, HighlightRule>,
  categoryOverrides: Record<string, HighlightRule>,
  existingTemplateNames: string[],
): string[] {
  return existingTemplateNames.filter(name => !defaults[name] && !categoryOverrides[name]);
}

function withRule(
  overrides: HighlightRuleOverrides,
  category: HighlightRuleCategory,
  key: string,
  rule: HighlightRule,
): HighlightRuleOverrides {
  return { ...overrides, [category]: { ...overrides[category], [key]: rule } };
}

function withoutRule(
  overrides: HighlightRuleOverrides,
  category: HighlightRuleCategory,
  key: string,
): HighlightRuleOverrides {
  const remaining = { ...overrides[category] };
  delete remaining[key];
  return { ...overrides, [category]: remaining };
}

function emptyRule(): HighlightRule {
  return { enabled: true, groups: [[]] };
}

function parseOverridesOrEmpty(value: unknown): HighlightRuleOverrides {
  if (!value) return emptyHighlightRuleOverrides();
  try {
    return parseHighlightRuleOverrides(value);
  } catch {
    return emptyHighlightRuleOverrides();
  }
}

const RuleSection = ({category, defaults, entries, scope, supportsLevel2, overrides, onChange}: {
  category: HighlightRuleCategory,
  defaults: Record<string, HighlightRule>,
  entries: RuleSectionEntry[],
  scope: SignalScope,
  supportsLevel2?: boolean,
  overrides: HighlightRuleOverrides,
  onChange: (overrides: HighlightRuleOverrides) => void,
}) => <>
  {entries.map(entry => {
    const rule = overrides[category][entry.key] ?? defaults[entry.key];
    if (!rule) return null;
    return <HighlightRuleEditor
      key={entry.key}
      title={entry.title}
      description={entry.description}
      warning={entry.warning}
      rule={rule}
      scope={scope}
      supportsLevel2={supportsLevel2}
      isCustomized={!!overrides[category][entry.key]}
      hasDefault={!!defaults[entry.key]}
      onChange={updated => onChange(withRule(overrides, category, entry.key, updated))}
      onReset={() => onChange(withoutRule(overrides, category, entry.key))}
    />;
  })}
</>;

const AddRuleRow = ({options, onAdd}: {
  options: string[],
  onAdd: (templateName: string) => void,
}) => {
  const classes = useStyles(styles);
  if (options.length === 0) return null;
  return <div className={classes.addRuleRow}>
    <span className={classes.addRuleLabel}>Add a rule for:</span>
    <select
      className={classes.addRuleSelect}
      value=""
      onChange={e => { if (e.target.value) onAdd(e.target.value); }}
    >
      <option value="">Pick a template…</option>
      {options.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  </div>;
};

const CodeDefinedRules = ({names}: {names: string[]}) => {
  const classes = useStyles(styles);
  if (names.length === 0) return null;
  return <div className={classes.codeRules}>
    These templates highlight on rules that need more than a threshold — regexes over the content,
    formatting heuristics, duplicate detection — so they&apos;re defined in code and can&apos;t be edited here:{' '}
    {names.map((name, index) => <React.Fragment key={name}>
      {index > 0 && ', '}
      <span className={classes.codeRuleName}>{name}</span>
    </React.Fragment>)}
  </div>;
};

const HighlightRuleEditorPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const canEdit = userIsAdminOrMod(currentUser);

  const { data, loading, refetch } = useQuery(SupermodHighlightRuleOverridesQuery, { ssr: false, skip: !canEdit });
  const { data: messageTemplateData } = useQuery(ModerationTemplateNamesQuery, {
    variables: { selector: { moderationTemplatesList: { collectionName: 'Messages' } }, limit: 200 },
    ssr: false,
    skip: !canEdit,
  });
  const { data: rejectionTemplateData } = useQuery(ModerationTemplateNamesQuery, {
    variables: { selector: { moderationTemplatesList: { collectionName: 'Rejections' } }, limit: 200 },
    ssr: false,
    skip: !canEdit,
  });
  const [saveOverrides, { loading: saving, error: saveError }] = useMutation(SetSupermodHighlightRuleOverridesMutation);

  // `draft` is null until something is edited, so a save elsewhere shows up until then
  const [draft, setDraft] = useState<HighlightRuleOverrides | null>(null);
  const savedOverrides = useMemo(() => parseOverridesOrEmpty(data?.supermodHighlightRuleOverrides), [data]);
  const overrides = draft ?? savedOverrides;
  const isDirty = jsonStringifyDeterministic(overrides) !== jsonStringifyDeterministic(savedOverrides);

  const messageTemplateNames = useMemo(
    () => (messageTemplateData?.moderationTemplates?.results ?? []).map(template => template.name),
    [messageTemplateData],
  );
  const rejectionTemplateNames = useMemo(
    () => (rejectionTemplateData?.moderationTemplates?.results ?? []).map(template => template.name),
    [rejectionTemplateData],
  );

  const onSave = useCallback(async () => {
    await saveOverrides({ variables: { overrides } });
    await refetch();
    setDraft(null);
  }, [saveOverrides, overrides, refetch]);

  if (!canEdit) {
    return <ErrorAccessDenied />;
  }

  return <SingleColumnSection>
    <SectionTitle title="Supermod Highlight Rules" />
    <div className={classes.intro}>
      Which moderator actions and templates get called out in the moderation inbox for a given user.
      A rule highlights when every condition in a set holds; extra sets are alternatives (OR).
      A condition on a value the user doesn&apos;t have — an LLM score for content that was never scored,
      say — never passes. Changes here apply to the whole moderation team.
    </div>

    <div className={classes.saveBar}>
      <button type="button" className={classes.saveButton} disabled={!isDirty || saving} onClick={onSave}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      <button type="button" className={classes.discardButton} disabled={!isDirty || saving} onClick={() => setDraft(null)}>
        Discard changes
      </button>
      <span className={classNames(classes.saveStatus, { [classes.errorStatus]: !!saveError })}>
        {saveError ? saveError.message : (isDirty ? "Unsaved changes" : "Up to date")}
      </span>
    </div>

    {loading && <Loading />}

    <SectionTitle title="Moderator Actions" />
    <RuleSection
      category="actions"
      defaults={DEFAULT_ACTION_HIGHLIGHT_RULES}
      entries={getActionEntries()}
      scope="user"
      supportsLevel2
      overrides={overrides}
      onChange={setDraft}
    />

    <SectionTitle title="Message Templates" />
    <RuleSection
      category="messageTemplates"
      defaults={DEFAULT_MESSAGE_TEMPLATE_RULES}
      entries={getTemplateEntries(DEFAULT_MESSAGE_TEMPLATE_RULES, overrides.messageTemplates, messageTemplateNames, !!messageTemplateData)}
      scope="user"
      overrides={overrides}
      onChange={setDraft}
    />
    <AddRuleRow
      options={getAddRuleOptions(DEFAULT_MESSAGE_TEMPLATE_RULES, overrides.messageTemplates, messageTemplateNames)}
      onAdd={name => setDraft(withRule(overrides, 'messageTemplates', name, emptyRule()))}
    />
    <CodeDefinedRules names={codeDefinedMessageTemplateRuleNames} />

    <SectionTitle title="Rejection Templates" />
    <RuleSection
      category="rejectionTemplates"
      defaults={DEFAULT_REJECTION_TEMPLATE_RULES}
      entries={getTemplateEntries(DEFAULT_REJECTION_TEMPLATE_RULES, overrides.rejectionTemplates, rejectionTemplateNames, !!rejectionTemplateData)}
      scope="all"
      overrides={overrides}
      onChange={setDraft}
    />
    <AddRuleRow
      options={getAddRuleOptions(DEFAULT_REJECTION_TEMPLATE_RULES, overrides.rejectionTemplates, rejectionTemplateNames)}
      onAdd={name => setDraft(withRule(overrides, 'rejectionTemplates', name, emptyRule()))}
    />
    <CodeDefinedRules names={codeDefinedRejectionTemplateRuleNames} />
  </SingleColumnSection>;
};

export default HighlightRuleEditorPage;
