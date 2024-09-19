// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  card: {
    padding: theme.spacing.unit,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: "350px",
    ...commentBodyStyles(theme),
  },
  jargonWord: {
    color: theme.palette.grey[500],
  }
});

export const JargonTooltip = ({classes, children, text, isFirstOccurrence = false}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
  text: string,
  isFirstOccurrence?: boolean
}) => {
  const { LWTooltip } = Components;
  const tooltip = <Card className={classes.card}>{text}</Card>  
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <LWTooltip title={tooltip} tooltip={false}>
    <span className={ isFirstOccurrence ? classes.jargonWord : undefined}>{children}</span>
  </LWTooltip>;
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
