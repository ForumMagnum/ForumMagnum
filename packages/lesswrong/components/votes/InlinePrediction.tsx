import React, { useContext } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ContentReplacedSubstringComponentInfo } from '../contents/contentBodyUtil';
import { SideItem } from '../contents/SideItems';
import { useHover } from '../common/withHover';
import SideItemLine from '../contents/SideItemLine';
import LWTooltip from '../common/LWTooltip';
import { createNewElicitPrediction, elicitBlockDataQuery, elicitPredictionMutation, PredictionGraph } from '../contents/ElicitBlock';
import { Paper } from '../widgets/Paper';
import { useCurrentUser } from '../common/withUser';
import { SmallPredictionGraph } from '../prediction/SmallPredictionGraph';
import { useMutation } from '@apollo/client/react';
import { useDialog } from '../common/withDialog';
import { useQuery } from '@/lib/crud/useQuery';
import LoginPopup from '../users/LoginPopup';
import { PostsPageContext } from '../posts/PostsPage/PostsPageContext';
import { gql } from '@/lib/generated/gql-codegen';
import { userCanMoveInlinePredictionToComment } from '@/lib/utils/predictionUtil';
import { useAddInlinePredictions } from './lwReactions/AddClaimProbabilityButton';
import { CommentsListMultiQuery } from '../posts/queries';

const styles = defineStyles("InlinePrediction", (theme: ThemeType) => ({
  inlineClaimText: {
  },
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
  const classes = useStyles(styles);
  return <span className={classes.inlineClaimText}>
    {children}
    <SideItem options={{format: "icon"}}>
      <SidebarInlinePredictionMarker inlinePrediction={inlinePrediction}/>
    </SideItem>
  </span>
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
      {/*<InlinePredictionIcon variant="existing"/>*/}
      <SmallPredictionGraph
        currentUserPrediction={inlinePrediction.question.currentUserPrediction}
        buckets={inlinePrediction.question.distribution}
      />
    </LWTooltip>
  </span>
}

const InlinePredictionDialog = ({inlinePrediction}: {
  inlinePrediction: InlinePredictionsFragment
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const currentUserIsCreator = !!currentUser && currentUser._id === inlinePrediction.user?._id;

  const questionId = inlinePrediction.question._id;
  const {openDialog} = useDialog();

  const { data, loading } = useQuery(elicitBlockDataQuery, { ssr: true, variables: { questionId } });
  const [makeElicitPrediction] = useMutation(elicitPredictionMutation);
  const allPredictions = data?.ElicitBlockData?.predictions || [];

  const postPageContext = useContext(PostsPageContext);
  const currentUserIsPostAuthor = !!postPageContext && !!currentUser && postPageContext.fullPost?.userId === currentUser._id;
  const canMoveToComment = userCanMoveInlinePredictionToComment({
    currentUserIsCreator,
    currentUserIsPostAuthor
  });
  
  const [convertToCommentMutation] = useMutation(gql(`
    mutation convertPredictionToComment($inlinePredictionId: String!) {
      convertPredictionToComment(inlinePredictionId: $inlinePredictionId) {
        _id
      }
    }
  `), {
    refetchQueries: [
      CommentsListMultiQuery
    ],
  });

  const { inlinePredictionOps } = useAddInlinePredictions();
  const { removeInlinePrediction } = inlinePredictionOps;

  const convertToComment = async () => {
    await convertToCommentMutation({
      variables: {
        inlinePredictionId: inlinePrediction._id,
      },
    });
    removeInlinePrediction(inlinePrediction._id);
  };

  return <Paper className={classes.dialog}>
    <PredictionGraph
      allPredictions={allPredictions}
      title={inlinePrediction.question.title}
      loading={loading}
      makePrediction={async (prob) => {
        if (currentUser) {
          const predictions = data?.ElicitBlockData?.predictions || []
          const filteredPredictions = predictions.filter((prediction: any) => prediction?.creator?.sourceUserId !== currentUser._id)
          // When you click on the slice that corresponds to your current prediction, you cancel it (i.e. double-clicking cancels any current predictions)
          const newPredictions = (prob === null)
            ? filteredPredictions
            : [
                createNewElicitPrediction(questionId, prob, currentUser),
                ...filteredPredictions
              ]
  
          await  makeElicitPrediction({
            variables: {
              questionId,
              prediction: prob,
            },
            ...(data?.ElicitBlockData
              ? {
                  optimisticResponse: {
                    __typename: "Mutation",
                    MakeElicitPrediction: {
                      ...data?.ElicitBlockData,
                      __typename: "ElicitBlockData",
                      predictions: newPredictions
                    }
                  }
                }
              : {}
            )
          })
        } else if (!currentUser) {
          openDialog({
            name: "LoginPopup",
            contents: ({onClose}) => <LoginPopup onClose={onClose} />
          });
        }
      }}
    />
    {canMoveToComment && <ConvertToCommentButton onClick={convertToComment}/>}
  </Paper>
}

const ConvertToCommentButton = ({onClick}: {
  onClick: () => void
}) => {
  return <a href="#" onClick={onClick}>Convert to comment</a>;
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

