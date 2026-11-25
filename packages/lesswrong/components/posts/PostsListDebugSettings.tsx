import React from 'react';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import { defineStyles, useStyles } from '../hooks/useStyles';
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
}));

const PostsListDebugSettings = ({ scenario, onScenarioChange }: {
  scenario: VisitorScenario,
  onScenarioChange: (scenario: VisitorScenario) => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>
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
  </div>;
};

export default PostsListDebugSettings;
