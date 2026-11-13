"use client";

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import {
  booleanHighlightOperators,
  highlightOperatorLabels,
  highlightOperatorUsesMinimumMatches,
  isCaseSensitiveRegexHighlightOperator,
  isNumericHighlightOperator,
  isRegexHighlightOperator,
  numericHighlightOperators,
  regexHighlightOperators,
  type HighlightCondition,
  type HighlightConditionOperator,
  type HighlightRule,
} from '@/lib/moderatorHighlights/highlightRuleTypes';
import {
  HIGHLIGHT_SIGNALS,
  highlightSignalGroups,
  type HighlightSignal,
  type HighlightSignalGroup,
} from './highlightSignals';

const styles = defineStyles('HighlightRuleEditor', (theme: ThemeType) => ({
  card: {
    border: theme.palette.border.slightlyFaint,
    borderRadius: 3,
    padding: 12,
    marginBottom: 12,
    background: theme.palette.panelBackground.default,
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  collapsedCardHeader: {
    marginBottom: 0,
  },
  cardTitle: {
    ...theme.typography.body2,
    fontWeight: 600,
    flexGrow: 1,
  },
  collapseButton: {
    ...theme.typography.body2,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexGrow: 1,
    minWidth: 0,
    padding: 0,
    border: 'none',
    background: 'none',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  collapseIcon: {
    flexShrink: 0,
    fontSize: 18,
  },
  badge: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 3,
    background: theme.palette.greyAlpha(0.08),
    color: theme.palette.grey[700],
  },
  customizedBadge: {
    background: theme.palette.primaryAlpha(0.12),
    color: theme.palette.primary.dark,
  },
  warningBadge: {
    color: theme.palette.error.main,
  },
  enabledToggle: {
    ...theme.typography.body2,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: theme.palette.grey[700],
    cursor: 'pointer',
  },
  textButton: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    '&:hover': {
      opacity: 0.8,
    },
  },
  dangerButton: {
    color: theme.palette.error.main,
  },
  sectionLabel: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 4,
  },
  level2Section: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: theme.palette.border.faint,
  },
  group: {
    border: theme.palette.border.faint,
    borderRadius: 3,
    padding: 8,
  },
  orSeparator: {
    ...theme.typography.body2,
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.grey[600],
    textAlign: 'center',
    margin: '4px 0',
  },
  conditionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
  conditionContainer: {
    marginBottom: 6,
  },
  signalSelect: {
    ...theme.typography.body2,
    fontSize: 13,
    flex: '1 1 0',
    minWidth: 0,
    padding: 3,
  },
  operatorSelect: {
    ...theme.typography.body2,
    fontSize: 13,
    flex: '1 1 0',
    minWidth: 0,
    padding: 3,
  },
  valueInput: {
    ...theme.typography.body2,
    fontSize: 13,
    width: 80,
    padding: 3,
  },
  regexEditor: {
    ...theme.typography.body2,
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 0',
    minWidth: 0,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  regexInput: {
    ...theme.typography.body2,
    flex: '1 1 0',
    minWidth: 0,
    padding: 3,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  invalidRegexInput: {
    borderColor: theme.palette.error.main,
  },
  regexError: {
    ...theme.typography.body2,
    marginTop: 2,
    marginLeft: 6,
    fontSize: 11,
    color: theme.palette.error.main,
  },
  explanationInput: {
    ...theme.typography.body2,
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 4,
    padding: '3px 6px',
    fontSize: 12,
    color: theme.palette.grey[700],
  },
  removeCondition: {
    ...theme.typography.body2,
    fontSize: 14,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    '&:hover': {
      color: theme.palette.error.main,
    },
  },
  groupButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 4,
  },
  emptyNote: {
    ...theme.typography.body2,
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.palette.grey[600],
    marginBottom: 6,
  },
  description: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
}));

export type SignalScope = 'user' | 'all';

interface SignalOptionGroup {
  group: HighlightSignalGroup;
  signals: { name: string, signal: HighlightSignal }[];
}

function getSignalOptionGroups(scope: SignalScope): SignalOptionGroup[] {
  const available = Object.entries(HIGHLIGHT_SIGNALS)
    .filter(([_, signal]) => scope === 'all' || signal.scope === 'user');
  return highlightSignalGroups
    .map(group => ({
      group,
      signals: available.filter(([_, signal]) => signal.group === group).map(([name, signal]) => ({ name, signal })),
    }))
    .filter(optionGroup => optionGroup.signals.length > 0);
}

function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, i) => (i === index ? value : item));
}

function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

function defaultConditionForSignal(signalName: string): HighlightCondition {
  const signal = HIGHLIGHT_SIGNALS[signalName];
  if (signal?.type === 'boolean') return { signal: signalName, operator: 'isTrue', value: null };
  if (signal?.type === 'string' || signal?.type === 'stringList') {
    return { signal: signalName, operator: 'matchesRegex', value: '.+' };
  }
  return { signal: signalName, operator: 'gte', value: 1 };
}

function getRegexError(pattern: string): string | null {
  try {
    new RegExp(pattern);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid regular expression';
  }
}

const ConditionRow = ({condition, scope, onChange, onRemove}: {
  condition: HighlightCondition,
  scope: SignalScope,
  onChange: (condition: HighlightCondition) => void,
  onRemove: () => void,
}) => {
  const classes = useStyles(styles);
  const signal = HIGHLIGHT_SIGNALS[condition.signal];
  const operators: readonly HighlightConditionOperator[] = signal?.type === 'boolean'
    ? booleanHighlightOperators
    : signal?.type === 'string' || signal?.type === 'stringList'
      ? regexHighlightOperators
      : numericHighlightOperators;
  const regexError = isRegexHighlightOperator(condition.operator) && typeof condition.value === 'string'
    ? getRegexError(condition.value)
    : null;

  const onSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(defaultConditionForSignal(e.target.value));
  };

  const onOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const operator = operators.find(candidate => candidate === e.target.value);
    if (!operator) return;
    const value = isNumericHighlightOperator(operator)
      ? (typeof condition.value === 'number' ? condition.value : 0)
      : isRegexHighlightOperator(operator)
        ? (typeof condition.value === 'string' ? condition.value : '.+')
        : null;
    onChange({
      signal: condition.signal,
      operator,
      value,
      ...(highlightOperatorUsesMinimumMatches(operator) ? { minimumMatches: condition.minimumMatches ?? 2 } : {}),
      ...(condition.explanation ? { explanation: condition.explanation } : {}),
    });
  };

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onChange({ ...condition, value: isFinite(value) ? value : 0 });
  };

  return <div className={classes.conditionContainer}>
    <div className={classes.conditionRow}>
      <select className={classes.signalSelect} value={condition.signal} onChange={onSignalChange}>
        {!signal && <option value={condition.signal}>{`Unknown signal: ${condition.signal}`}</option>}
        {getSignalOptionGroups(scope).map(optionGroup => (
          <optgroup key={optionGroup.group} label={optionGroup.group}>
            {optionGroup.signals.map(({ name, signal: optionSignal }) => (
              <option key={name} value={name} title={optionSignal.description}>{optionSignal.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <select className={classes.operatorSelect} value={condition.operator} onChange={onOperatorChange}>
        {operators.map(operator => (
          <option key={operator} value={operator}>{highlightOperatorLabels[operator]}</option>
        ))}
      </select>
      {isNumericHighlightOperator(condition.operator) && (
        <input
          type="number"
          step="any"
          className={classes.valueInput}
          value={typeof condition.value === 'number' ? condition.value : 0}
          onChange={onValueChange}
        />
      )}
      {isRegexHighlightOperator(condition.operator) && <div className={classes.regexEditor}>
        {highlightOperatorUsesMinimumMatches(condition.operator) && <input
          type="number"
          min={1}
          step={1}
          className={classes.valueInput}
          value={condition.minimumMatches ?? 2}
          onChange={event => onChange({
            ...condition,
            minimumMatches: Math.max(1, Math.floor(Number(event.target.value) || 1)),
          })}
          aria-label="Minimum regex match count"
        />}
        <span>/</span>
        <input
          type="text"
          className={classNames(classes.regexInput, { [classes.invalidRegexInput]: !!regexError })}
          value={typeof condition.value === 'string' ? condition.value : ''}
          onChange={event => onChange({ ...condition, value: event.target.value })}
          aria-invalid={!!regexError}
          spellCheck={false}
        />
        <span>/{isCaseSensitiveRegexHighlightOperator(condition.operator) ? '' : 'i'}</span>
      </div>}
      <button type="button" className={classes.removeCondition} onClick={onRemove} title="Remove condition">✕</button>
    </div>
    {regexError && <div className={classes.regexError}>{regexError}</div>}
    <input
      type="text"
      className={classes.explanationInput}
      value={condition.explanation ?? ''}
      onChange={event => onChange({ ...condition, explanation: event.target.value || undefined })}
      placeholder="Plain-English explanation (optional)"
      aria-label="Condition explanation"
    />
  </div>;
};

const ConditionGroupsEditor = ({groups, scope, emptyNote, onChange}: {
  groups: HighlightCondition[][],
  scope: SignalScope,
  emptyNote: string,
  onChange: (groups: HighlightCondition[][]) => void,
}) => {
  const classes = useStyles(styles);
  const firstSignalName = getSignalOptionGroups(scope)[0]?.signals[0]?.name;

  if (groups.length === 0) {
    return <div>
      <div className={classes.emptyNote}>{emptyNote}</div>
      <button type="button" className={classes.textButton} onClick={() => onChange([[]])}>+ Add conditions</button>
    </div>;
  }

  return <div>
    {groups.map((group, groupIndex) => <React.Fragment key={groupIndex}>
      {groupIndex > 0 && <div className={classes.orSeparator}>OR</div>}
      <div className={classes.group}>
        {group.length === 0 && <div className={classes.emptyNote}>No conditions, so this always matches.</div>}
        {group.map((condition, conditionIndex) => (
          <ConditionRow
            key={conditionIndex}
            condition={condition}
            scope={scope}
            onChange={updated => onChange(replaceAt(groups, groupIndex, replaceAt(group, conditionIndex, updated)))}
            onRemove={() => onChange(replaceAt(groups, groupIndex, removeAt(group, conditionIndex)))}
          />
        ))}
        <div className={classes.groupButtons}>
          {firstSignalName && <button
            type="button"
            className={classes.textButton}
            onClick={() => onChange(replaceAt(groups, groupIndex, [...group, defaultConditionForSignal(firstSignalName)]))}
          >
            + Condition
          </button>}
          <button
            type="button"
            className={classNames(classes.textButton, classes.dangerButton)}
            onClick={() => onChange(removeAt(groups, groupIndex))}
          >
            Remove {groups.length > 1 ? 'these conditions' : 'all conditions'}
          </button>
        </div>
      </div>
    </React.Fragment>)}
    <div className={classes.groupButtons}>
      <button type="button" className={classes.textButton} onClick={() => onChange([...groups, []])}>
        + Alternative set of conditions (OR)
      </button>
    </div>
  </div>;
};

export const HighlightRuleEditor = ({title, description, rule, scope, isCustomized, hasDefault, warning, supportsLevel2, collapsible, initiallyExpanded, onChange, onReset}: {
  title: string,
  description?: string,
  rule: HighlightRule,
  scope: SignalScope,
  isCustomized: boolean,
  hasDefault: boolean,
  warning?: string,
  supportsLevel2?: boolean,
  collapsible?: boolean,
  initiallyExpanded?: boolean,
  onChange: (rule: HighlightRule) => void,
  onReset: () => void,
}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(!collapsible || !!initiallyExpanded);
  const contentsExpanded = !collapsible || expanded;
  const hasRule = hasDefault || isCustomized;

  useEffect(() => {
    if (initiallyExpanded) setExpanded(true);
  }, [initiallyExpanded]);

  return <div className={classNames(classes.card, { [classes.disabledCard]: hasRule && !rule.enabled })}>
    <div className={classNames(classes.cardHeader, { [classes.collapsedCardHeader]: !contentsExpanded })}>
      {collapsible
        ? <button
            type="button"
            className={classes.collapseButton}
            aria-expanded={contentsExpanded}
            onClick={() => setExpanded(current => !current)}
          >
            <ForumIcon icon={contentsExpanded ? "ExpandLess" : "ExpandMore"} className={classes.collapseIcon} />
            <span className={classes.cardTitle}>{title}</span>
          </button>
        : <span className={classes.cardTitle}>{title}</span>}
      {warning && <span className={classNames(classes.badge, classes.warningBadge)}>{warning}</span>}
      {!hasRule && <span className={classes.badge}>No rule</span>}
      {isCustomized && hasDefault && <span className={classNames(classes.badge, classes.customizedBadge)}>Customized</span>}
      {hasRule && <label className={classes.enabledToggle}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={e => onChange({ ...rule, enabled: e.target.checked })}
        />
        <span>Enabled</span>
      </label>}
      {isCustomized && <button type="button" className={classNames(classes.textButton, { [classes.dangerButton]: !hasDefault })} onClick={onReset}>
        {hasDefault ? 'Reset to default' : 'Delete rule'}
      </button>}
    </div>
    {contentsExpanded && <>
      {description && <div className={classes.description}>{description}</div>}
      <div className={classes.sectionLabel}>Highlight when all of:</div>
      <ConditionGroupsEditor
        groups={rule.groups}
        scope={scope}
        emptyNote="No conditions, so this never highlights."
        onChange={groups => onChange({ ...rule, groups })}
      />
      {supportsLevel2 && <div className={classes.level2Section}>
        <div className={classes.sectionLabel}>Promote to level 2 (colored outline) when all of:</div>
        <ConditionGroupsEditor
          groups={rule.level2Groups ?? []}
          scope={scope}
          emptyNote="No conditions, so this stays at level 1."
          onChange={level2Groups => onChange({ ...rule, level2Groups })}
        />
      </div>}
    </>}
  </div>;
};

export default HighlightRuleEditor;
