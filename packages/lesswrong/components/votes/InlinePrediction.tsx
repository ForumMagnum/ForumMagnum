import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ContentReplacedSubstringComponentInfo } from '../contents/contentBodyUtil';
import { SideItem } from '../contents/SideItems';
import { useHover } from '../common/withHover';
import SideItemLine from '../contents/SideItemLine';
import { InlinePredictionIcon } from './lwReactions/AddClaimProbabilityButton';
import LWTooltip from '../common/LWTooltip';
import ElicitBlock from '../contents/ElicitBlock';
import { Paper } from '../widgets/Paper';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles("InlinePrediction", (theme: ThemeType) => ({
  inlinePredictionSidebarLine: {
    background: theme.palette.sideItemIndicator.inlinePrediction,
  },
  dialog: {
    padding: 16,
    minWidth: 600,
  },
}))

export const InlinePredictionMarker = ({inlinePrediction, children}: {
  inlinePrediction: InlinePredictionsFragment
  children: React.ReactNode
}) => {
  return <>
    {children}
    <SideItem options={{format: "icon"}}>
      <SidebarInlinePredictionMarker inlinePrediction={inlinePrediction}/>
    </SideItem>
  </>
}

const SidebarInlinePredictionMarker = ({inlinePrediction}: {
  inlinePrediction: InlinePredictionsFragment
}) => {
  const { eventHandlers, hover } = useHover();
  const classes = useStyles(styles);

  return <span {...eventHandlers}>
    <SideItemLine colorClass={classes.inlinePredictionSidebarLine}/>
    <LWTooltip
      title={<InlinePredictionDialog inlinePrediction={inlinePrediction}/>}
      placement="bottom-start"
      tooltip={false}
      flip={true}
      inlineBlock={false}
      clickable={true}
    >
      <InlinePredictionIcon variant="existing"/>
    </LWTooltip>
  </span>
}

const InlinePredictionDialog = ({inlinePrediction}: {
  inlinePrediction: InlinePredictionsFragment
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const currentUserIsCreator = currentUser && currentUser._id === inlinePrediction.user?._id;

  return <Paper className={classes.dialog}>
    <ElicitBlock questionId={inlinePrediction.question._id} />
  </Paper>
}

export const inlinePredictionsToReplacements = (inlinePredictions: InlinePredictionsFragment[]): ContentReplacedSubstringComponentInfo[] => {
  return inlinePredictions.map(inlinePrediction => ({
    replacedString: inlinePrediction.quote,
    componentName: "InlinePredictionMarker",
    replace: "first",
    caseInsensitive: false,
    isRegex: false,
    props: { inlinePrediction, },
  }));
}

