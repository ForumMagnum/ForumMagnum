import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { conditionalVisibilityModes, ConditionalVisibilitySettings } from './conditionalVisibility';

const styles = defineStyles("ShowBlockVisibilityCondition", (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.normal,
    borderRadius: 4,
    padding: 8,
    margin: 8,
  },
  condition: {
    marginBottom: 8,
  },
  conditionType: {
    fontWeight: "bold",
  },
  contents: {
  },
}));

const ShowBlockVisibilityCondition = ({options, children}: {
  options: ConditionalVisibilitySettings
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  const mode = conditionalVisibilityModes[options?.type];
  if (!mode) return null;

  return <div className={classes.root}>
    <div className={classes.condition}>
      {('inverted' in options && options.inverted) ? "!" : ""}
      {(options.type === "ifPathBeforeOrAfter") && (options.order==="before" ? "If before " : "If after")}
      <span className={classes.conditionType}>{options.type !== "ifPathBeforeOrAfter" && mode.label}</span>
      {('otherPage' in options) ? options.otherPage : ""}
    </div>
    <div className={classes.contents}>
      {children}
    </div>
  </div>
}

const ShowBlockVisibilityConditionComponent = registerComponent('ShowBlockVisibilityCondition', ShowBlockVisibilityCondition);

declare global {
  interface ComponentTypes {
    ShowBlockVisibilityCondition: typeof ShowBlockVisibilityConditionComponent
  }
}

export default ShowBlockVisibilityConditionComponent;

