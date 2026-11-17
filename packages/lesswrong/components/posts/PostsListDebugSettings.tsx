import React, { useState } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import { frontpageScoringParamSpecs, isValidFrontpageScoringOverride, type FrontpageScoringParams } from '@/lib/scoring';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import LWTooltip from '../common/LWTooltip';
import { visitorScenarioOptions, type VisitorScenario } from './postsListDebugContext';

const styles = defineStyles('PostsListDebugSettings', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    marginTop: 8,
    marginBottom: 12,
    padding: '8px 12px',
    border: theme.palette.greyBorder('1px', 0.1),
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
  },
  section: {
    '& + &': {
      marginTop: 12,
    },
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  heading: {
    fontWeight: 600,
    fontSize: '1.1rem',
    color: theme.palette.text.primary,
  },
  description: {
    fontSize: '1rem',
    color: theme.palette.text.dim,
    marginBottom: 4,
  },
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 16,
  },
  radio: {
    padding: 4,
  },
  label: {
    fontSize: '1rem',
  },
  reset: {
    fontSize: '1rem',
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  formula: {
    fontSize: '1rem',
    color: theme.palette.text.dim,
  },
  fields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    columnGap: 24,
    rowGap: 6,
    marginTop: 8,
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    fontSize: '1rem',
  },
  fieldInput: {
    width: 72,
    padding: '3px 6px',
    border: theme.palette.border.grey400,
    borderRadius: 3,
    fontFamily: 'inherit',
    fontSize: '1rem',
    textAlign: 'right',
    color: theme.palette.text.primary,
    background: theme.palette.background.default,
    // The global styles remove the border from every focused input
    '&:focus': {
      border: theme.palette.border.grey800,
    },
  },
  fieldInputOverridden: {
    fontWeight: 600,
    '&, &:focus': {
      borderColor: theme.palette.primary.main,
    },
  },
  fieldInputInvalid: {
    '&, &:focus': {
      borderColor: theme.palette.error.main,
    },
  },
  error: {
    fontSize: '1rem',
    color: theme.palette.error.main,
    marginTop: 6,
  },
}));

type ScoringParamName = keyof FrontpageScoringParams;
type ScoringParamDrafts = Record<ScoringParamName, string>;

interface ScoringParamField {
  name: ScoringParamName
  label: string
  description: string
  step: number
}

const scoringParamFields: ScoringParamField[] = [
  {
    name: "karmaExponent",
    label: "Karma exponent",
    description: "The power that a post's karma is raised to, before any bonuses are added. Below 1 narrows the gap between high-karma and low-karma posts.",
    step: 0.05,
  },
  {
    name: "commentWeight",
    label: "Comment weight",
    description: "Karma added for each comment on the post.",
    step: 0.5,
  },
  {
    name: "frontpageBonus",
    label: "Frontpage bonus",
    description: "Karma added to frontpage posts.",
    step: 1,
  },
  {
    name: "curatedBonus",
    label: "Curated bonus",
    description: "Karma added to curated posts.",
    step: 1,
  },
  {
    name: "startingAgeHours",
    label: "Starting age (hours)",
    description: "Hours added to a post's age before the time decay is applied. Lower values favor brand-new posts more strongly.",
    step: 0.5,
  },
  {
    name: "decayFactorSlowest",
    label: "Slowest decay",
    description: "The time decay exponent for a visitor with no recent visits (an activity factor of 0).",
    step: 0.05,
  },
  {
    name: "decayFactorFastest",
    label: "Fastest decay",
    description: "The upper limit on the time decay exponent, which the most frequent visitors get.",
    step: 0.05,
  },
  {
    name: "activityWeight",
    label: "Activity weight",
    description: "How steeply the time decay exponent rises with the visitor's activity factor.",
    step: 0.1,
  },
  {
    name: "activityHalfLifeHours",
    label: "Activity half-life (hours)",
    description: "How quickly past visits stop counting towards the activity factor: a visit this many hours ago counts half as much as one just now.",
    step: 1,
  },
];

const defaultDrafts: ScoringParamDrafts = mapValues(frontpageScoringParamSpecs, spec => String(spec.defaultValue));

const getDraftValue = (name: ScoringParamName, draft: string): number =>
  draft === "" ? frontpageScoringParamSpecs[name].defaultValue : Number(draft);

const isDraftOverridden = (name: ScoringParamName, draft: string): boolean =>
  getDraftValue(name, draft) !== frontpageScoringParamSpecs[name].defaultValue;

const isDraftValid = (name: ScoringParamName, draft: string): boolean =>
  isValidFrontpageScoringOverride(name, getDraftValue(name, draft));

const getParamOverrides = (drafts: ScoringParamDrafts): Partial<FrontpageScoringParams> => Object.fromEntries(
  scoringParamFields
    .filter(({ name }) => isDraftOverridden(name, drafts[name]))
    .map(({ name }) => [name, getDraftValue(name, drafts[name])])
);

const getRangeError = ({ name, label }: ScoringParamField): string => {
  const { min, max } = frontpageScoringParamSpecs[name];
  return `${label} must be between ${min} and ${max}.`;
};

const ScoringParamInput = ({ field, draft, onChange }: {
  field: ScoringParamField,
  draft: string,
  onChange: (draft: string) => void,
}) => {
  const classes = useStyles(styles);
  const { name, label, description, step } = field;
  return <label className={classes.field}>
    <LWTooltip title={description} placement="top">
      <span>{label}</span>
    </LWTooltip>
    <input
      type="number"
      className={classNames(classes.fieldInput, {
        [classes.fieldInputOverridden]: isDraftOverridden(name, draft),
        [classes.fieldInputInvalid]: !isDraftValid(name, draft),
      })}
      value={draft}
      placeholder={defaultDrafts[name]}
      step={step}
      onChange={ev => onChange(ev.target.value)}
    />
  </label>;
};

const ScoringParamsForm = ({ paramOverrides, onParamOverridesChange }: {
  paramOverrides: Partial<FrontpageScoringParams>,
  onParamOverridesChange: (paramOverrides: Partial<FrontpageScoringParams>) => void,
}) => {
  const classes = useStyles(styles);
  const [drafts, setDrafts] = useState<ScoringParamDrafts>(() => ({ ...defaultDrafts, ...mapValues(paramOverrides, String) }));
  const applyParamOverrides = useDebouncedCallback(onParamOverridesChange, {
    rateLimitMs: 400,
    callOnLeadingEdge: false,
    onUnmount: "callIfScheduled",
    allowExplicitCallAfterUnmount: false,
  });
  const invalidFields = scoringParamFields.filter(({ name }) => !isDraftValid(name, drafts[name]));

  const updateDrafts = (newDrafts: ScoringParamDrafts) => {
    setDrafts(newDrafts);
    if (scoringParamFields.every(({ name }) => isDraftValid(name, newDrafts[name]))) {
      applyParamOverrides(getParamOverrides(newDrafts));
    }
  };

  return <div className={classes.section}>
    <div className={classes.headingRow}>
      <div className={classes.heading}>Scoring parameters</div>
      {!isEqual(drafts, defaultDrafts) && <a className={classes.reset} onClick={() => updateDrafts(defaultDrafts)}>
        Reset to defaults
      </a>}
    </div>
    <div className={classes.formula}>
      score = (karma ^ karma exponent + comments × comment weight + bonuses) × tag multipliers ÷ (age + starting age) ^ decay
    </div>
    <div className={classes.formula}>
      decay = min(slowest decay × (1 + activity weight × activity factor), fastest decay)
    </div>
    <div className={classes.fields}>
      {scoringParamFields.map(field => <ScoringParamInput
        key={field.name}
        field={field}
        draft={drafts[field.name]}
        onChange={draft => updateDrafts({ ...drafts, [field.name]: draft })}
      />)}
    </div>
    {invalidFields.length > 0 && <div className={classes.error}>
      Not applied: {invalidFields.map(getRangeError).join(" ")}
    </div>}
  </div>;
};

const PostsListDebugSettings = ({ scenario, onScenarioChange, paramOverrides, onParamOverridesChange }: {
  scenario: VisitorScenario,
  onScenarioChange: (scenario: VisitorScenario) => void,
  paramOverrides: Partial<FrontpageScoringParams>,
  onParamOverridesChange: (paramOverrides: Partial<FrontpageScoringParams>) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>
    <div className={classes.section}>
      <div className={classes.heading}>Simulate a visitor</div>
      <div className={classes.description}>
        Overrides the visit-frequency adjustment to how fast posts' scores decay with age.
      </div>
      <div className={classes.options}>
        {visitorScenarioOptions.map(({ value, label }) => <FormControlLabel
          key={value}
          control={<Radio
            checked={value === scenario}
            onChange={() => onScenarioChange(value)}
            className={classes.radio}
            value={value}
          />}
          label={<span className={classes.label}>{label}</span>}
        />)}
      </div>
    </div>
    <ScoringParamsForm paramOverrides={paramOverrides} onParamOverridesChange={onParamOverridesChange} />
  </div>;
};

export default PostsListDebugSettings;
