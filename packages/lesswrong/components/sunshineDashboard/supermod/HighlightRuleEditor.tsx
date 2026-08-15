"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  booleanHighlightOperators,
  highlightOperatorLabels,
  isNumericHighlightOperator,
  numericHighlightOperators,
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
  cardTitle: {
    ...theme.typography.body2,
    fontWeight: 600,
    flexGrow: 1,
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
    marginBottom: 6,
  },
  signalSelect: {
    ...theme.typography.body2,
    fontSize: 13,
    flexGrow: 1,
    maxWidth: 420,
    padding: 3,
  },
  operatorSelect: {
    ...theme.typography.body2,
    fontSize: 13,
    padding: 3,
  },
  valueInput: {
    ...theme.typography.body2,
    fontSize: 13,
    width: 80,
    padding: 3,
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
  return { signal: signalName, operator: 'gte', value: 1 };
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
    : numericHighlightOperators;

  const onSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(defaultConditionForSignal(e.target.value));
  };

  const onOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const operator = operators.find(candidate => candidate === e.target.value);
    if (!operator) return;
    onChange({ ...condition, operator, value: isNumericHighlightOperator(operator) ? condition.value ?? 0 : null });
  };

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onChange({ ...condition, value: isFinite(value) ? value : 0 });
  };

  return <div className={classes.conditionRow}>
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
        value={condition.value ?? 0}
        onChange={onValueChange}
      />
    )}
    <button type="button" className={classes.removeCondition} onClick={onRemove} title="Remove condition">✕</button>
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

/**
 * Editor for one rule: the conditions that make it highlight, plus (for moderator actions)
 * the conditions that promote it from level 1 to level 2.
 */
export const HighlightRuleEditor = ({title, description, rule, scope, isCustomized, hasDefault, warning, supportsLevel2, onChange, onReset}: {
  title: string,
  description?: string,
  rule: HighlightRule,
  scope: SignalScope,
  isCustomized: boolean,
  hasDefault: boolean,
  warning?: string,
  supportsLevel2?: boolean,
  onChange: (rule: HighlightRule) => void,
  onReset: () => void,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.card, { [classes.disabledCard]: !rule.enabled })}>
    <div className={classes.cardHeader}>
      <span className={classes.cardTitle}>{title}</span>
      {warning && <span className={classNames(classes.badge, classes.warningBadge)}>{warning}</span>}
      {isCustomized && <span className={classNames(classes.badge, classes.customizedBadge)}>Customized</span>}
      <label className={classes.enabledToggle}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={e => onChange({ ...rule, enabled: e.target.checked })}
        />
        <span>Enabled</span>
      </label>
      {isCustomized && <button type="button" className={classNames(classes.textButton, { [classes.dangerButton]: !hasDefault })} onClick={onReset}>
        {hasDefault ? 'Reset to default' : 'Delete rule'}
      </button>}
      {!isCustomized && !hasDefault && <button type="button" className={classNames(classes.textButton, classes.dangerButton)} onClick={onReset}>
        Delete rule
      </button>}
    </div>
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
  </div>;
};

export default HighlightRuleEditor;
