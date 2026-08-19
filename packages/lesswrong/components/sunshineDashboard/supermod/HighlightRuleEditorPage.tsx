"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSubscribedLocation } from '@/lib/routeUtil';
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
} from './templateHighlightRules';
import HighlightRuleEditor, { type SignalScope } from './HighlightRuleEditor';
import { SupermodHighlightRuleOverridesQuery } from './useHighlightRuleOverrides';

const SetSupermodHighlightRuleOverridesMutation = gql(`
  mutation setSupermodHighlightRuleOverrides($overrides: JSON!) {
    setSupermodHighlightRuleOverrides(overrides: $overrides)
  }
`);

const ModerationTemplatesForHighlightRulesQuery = gql(`
  query moderationTemplatesForHighlightRules($selector: ModerationTemplateSelector, $limit: Int) {
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
}));

interface RuleSectionEntry {
  key: string;
  title: string;
  anchor?: string;
  description?: string;
  warning?: string;
}

interface HighlightRuleTemplate {
  _id: string;
  name: string;
}

function getActionEntries(): RuleSectionEntry[] {
  return highlightableModeratorActions.map(action => ({
    key: action,
    title: moderatorActionHighlightLabels[action],
    description: `Level 2 outline color: ${moderatorActionHighlightColors[action]}`,
  }));
}

/** Every current template, plus stale default or customized rules whose template was deleted */
function getTemplateEntries(
  defaults: Record<string, HighlightRule>,
  categoryOverrides: Record<string, HighlightRule>,
  templates: HighlightRuleTemplate[],
  templatesLoaded: boolean,
): RuleSectionEntry[] {
  const templatesById = new Map(templates.map(template => [template._id, template]));
  const templateIds = [...new Set([
    ...templates.map(template => template._id),
    ...Object.keys(defaults),
    ...Object.keys(categoryOverrides),
  ])];
  return templateIds.map(templateId => {
    const template = templatesById.get(templateId);
    return {
      key: templateId,
      title: template?.name.trim() ?? `Unknown template (${templateId})`,
      anchor: templateId,
      warning: templatesLoaded && !template ? "No template with this ID" : undefined,
    };
  });
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
  return { enabled: true, groups: [] };
}

function parseOverridesOrEmpty(value: unknown): HighlightRuleOverrides {
  if (!value) return emptyHighlightRuleOverrides();
  try {
    return parseHighlightRuleOverrides(value);
  } catch {
    return emptyHighlightRuleOverrides();
  }
}

const RuleSection = ({category, defaults, entries, scope, supportsLevel2, collapsible, expandedAnchor, overrides, onChange}: {
  category: HighlightRuleCategory,
  defaults: Record<string, HighlightRule>,
  entries: RuleSectionEntry[],
  scope: SignalScope,
  supportsLevel2?: boolean,
  collapsible?: boolean,
  expandedAnchor?: string | null,
  overrides: HighlightRuleOverrides,
  onChange: (overrides: HighlightRuleOverrides) => void,
}) => <>
  {entries.map(entry => {
    const rule = overrides[category][entry.key] ?? defaults[entry.key] ?? emptyRule();
    return <div key={entry.key} id={entry.anchor}>
      <HighlightRuleEditor
        title={entry.title}
        description={entry.description}
        warning={entry.warning}
        rule={rule}
        scope={scope}
        supportsLevel2={supportsLevel2}
        collapsible={collapsible}
        initiallyExpanded={!!entry.anchor && entry.anchor === expandedAnchor}
        isCustomized={!!overrides[category][entry.key]}
        hasDefault={!!defaults[entry.key]}
        onChange={updated => onChange(withRule(overrides, category, entry.key, updated))}
        onReset={() => onChange(withoutRule(overrides, category, entry.key))}
      />
    </div>;
  })}
</>;

const HighlightRuleEditorPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const canEdit = userIsAdminOrMod(currentUser);
  const { hash } = useSubscribedLocation();

  const { data, loading, refetch } = useQuery(SupermodHighlightRuleOverridesQuery, { ssr: false, skip: !canEdit });
  const { data: messageTemplateData } = useQuery(ModerationTemplatesForHighlightRulesQuery, {
    variables: { selector: { moderationTemplatesList: { collectionName: 'Messages' } }, limit: 200 },
    ssr: false,
    skip: !canEdit,
  });
  const { data: rejectionTemplateData } = useQuery(ModerationTemplatesForHighlightRulesQuery, {
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

  const messageTemplates = messageTemplateData?.moderationTemplates?.results ?? [];
  const rejectionTemplates = rejectionTemplateData?.moderationTemplates?.results ?? [];
  const targetTemplateId = hash.startsWith('#') ? hash.slice(1) : null;

  useEffect(() => {
    if (!targetTemplateId) return;
    document.getElementById(targetTemplateId)?.scrollIntoView({ block: 'center' });
  }, [targetTemplateId, messageTemplateData, rejectionTemplateData]);

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
      say — never passes. Text conditions use JavaScript regular expressions; the editor shows
      whether matching ignores case and can require several distinct matches. Changes here apply
      to the whole moderation team.
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
      collapsible
      overrides={overrides}
      onChange={setDraft}
    />

    <SectionTitle title="Message Templates" />
    <RuleSection
      category="messageTemplates"
      defaults={DEFAULT_MESSAGE_TEMPLATE_RULES}
      entries={getTemplateEntries(DEFAULT_MESSAGE_TEMPLATE_RULES, overrides.messageTemplates, messageTemplates, !!messageTemplateData)}
      scope="user"
      collapsible
      expandedAnchor={targetTemplateId}
      overrides={overrides}
      onChange={setDraft}
    />

    <SectionTitle title="Rejection Templates" />
    <RuleSection
      category="rejectionTemplates"
      defaults={DEFAULT_REJECTION_TEMPLATE_RULES}
      entries={getTemplateEntries(DEFAULT_REJECTION_TEMPLATE_RULES, overrides.rejectionTemplates, rejectionTemplates, !!rejectionTemplateData)}
      scope="all"
      collapsible
      expandedAnchor={targetTemplateId}
      overrides={overrides}
      onChange={setDraft}
    />
  </SingleColumnSection>;
};

export default HighlightRuleEditorPage;
