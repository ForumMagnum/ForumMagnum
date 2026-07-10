'use client';

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { researchMono, researchRadius, researchTransition, researchWarmAlpha } from './researchStyleUtils';
import {
  EFFORT_LEVEL_LABELS,
  MODEL_ALIAS_LABELS,
  MODEL_ALIAS_TOOLTIPS,
  RESEARCH_EFFORT_LEVELS,
  RESEARCH_MODEL_ALIASES,
  effortFillFraction,
  isResearchEffortLevel,
  isResearchModelAlias,
  type ResearchEffortLevel,
  type ResearchModelAlias,
} from '@/lib/research/agentModels';
import type { ModelEffortSelection } from './useModelEffortSelection';

const styles = defineStyles('ModelEffortPicker', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    // Sits inside a composer's action row; keep it out of the way but tappable.
    flex: 'none',
  },
  // A native <select> styled down to a bare inline control, matching the
  // /query header's environment picker (researchMono, dim until hover).
  select: {
    appearance: 'none',
    background: 'transparent',
    border: 'none',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    padding: '2px 3px',
    maxWidth: 120,
    cursor: 'pointer',
    transition: `color ${researchTransition}`,
    '&:hover': {
      color: theme.palette.text.primary,
    },
    '&:disabled': {
      color: theme.palette.text.dim,
      cursor: 'default',
      opacity: 0.6,
    },
  },
  effortGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  // The reasoning-effort "dial": a small ring that fills clockwise with the
  // level (low ≈ 1/5 … max = full), giving an at-a-glance read of the setting.
  dial: {
    flex: 'none',
    width: 11,
    height: 11,
    borderRadius: '50%',
    border: `1px solid ${researchWarmAlpha(0.35)}`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
}));

interface ModelEffortPickerProps {
  selection: ModelEffortSelection;
  onModelChange: (model: ResearchModelAlias) => void;
  onEffortChange: (effort: ResearchEffortLevel) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact per-turn model + reasoning-effort control, dropped into a composer's
 * action slot. Controlled: the selection and setters come from
 * `useModelEffortSelection`. Pointer/key events are stopped at the root so the
 * control still works when mounted inside a Lexical editor (e.g. the /query
 * header), where the editor would otherwise capture them.
 */
export const ModelEffortPicker = ({
  selection,
  onModelChange,
  onEffortChange,
  disabled = false,
  className,
}: ModelEffortPickerProps) => {
  const classes = useStyles(styles);
  const fraction = effortFillFraction(selection.effort);
  // Fill the dial clockwise from 12 o'clock; the current colour is the fill,
  // a faint wash the remainder, so even "low" reads as partly filled.
  const dialBackground = `conic-gradient(currentColor ${fraction * 360}deg, ${researchWarmAlpha(0.12)} 0)`;

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <span
      className={classNames(classes.root, className)}
      onMouseDown={stop}
      onPointerDown={stop}
      onKeyDown={stop}
    >
      <select
        className={classes.select}
        value={selection.model}
        disabled={disabled}
        aria-label="Model"
        title={MODEL_ALIAS_TOOLTIPS[selection.model]}
        onChange={(event) => {
          if (isResearchModelAlias(event.target.value)) onModelChange(event.target.value);
        }}
      >
        {RESEARCH_MODEL_ALIASES.map((alias) => (
          <option key={alias} value={alias} title={MODEL_ALIAS_TOOLTIPS[alias]}>
            {MODEL_ALIAS_LABELS[alias]}
          </option>
        ))}
      </select>
      <span className={classes.effortGroup}>
        <span
          className={classes.dial}
          style={{ background: dialBackground }}
          aria-hidden="true"
        />
        <select
          className={classes.select}
          value={selection.effort}
          disabled={disabled}
          aria-label="Reasoning effort"
          title={`Reasoning effort: ${EFFORT_LEVEL_LABELS[selection.effort]}`}
          onChange={(event) => {
            if (isResearchEffortLevel(event.target.value)) onEffortChange(event.target.value);
          }}
        >
          {RESEARCH_EFFORT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {EFFORT_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </span>
    </span>
  );
};

export default ModelEffortPicker;
