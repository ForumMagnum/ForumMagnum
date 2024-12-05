import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { conditionalVisibilityModes, ConditionalVisibilitySettings } from './conditionalVisibility';

const styles = defineStyles("ShowBlockVisibilityCondition", (theme: ThemeType) => ({
  root: {
  },
}));

const ShowBlockVisibilityCondition = ({options}: {
  options: ConditionalVisibilitySettings
}) => {
  const classes = useStyles(styles);
  const mode = conditionalVisibilityModes[options?.type];
  if (!mode) return null;

  return <div className={classes.root}>
    {('inverted' in options && options.inverted) ? "!" : ""}
    {(options.type === "ifPathBeforeOrAfter" && options.order==="before") ? "If before " : "If after"}
    {options.type !== "ifPathBeforeOrAfter" && mode.label}
    {('otherPage' in options) ? options.otherPage : ""}
  </div>
}

const ShowBlockVisibilityConditionComponent = registerComponent('ShowBlockVisibilityCondition', ShowBlockVisibilityCondition);

declare global {
  interface ComponentTypes {
    ShowBlockVisibilityCondition: typeof ShowBlockVisibilityConditionComponent
  }
}

