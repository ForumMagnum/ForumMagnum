import React, { useState } from 'react';
import times from 'lodash/times';
import groupBy from 'lodash/groupBy';
import maxBy from 'lodash/maxBy';
import { useMutation } from "@apollo/client/react";
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import { randomId } from '../../lib/random';
import { elicitSourceId, elicitSourceURL } from '@/lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import sortBy from 'lodash/sortBy';
import some from 'lodash/some';
import withErrorBoundary from '../common/withErrorBoundary';
import { registerComponent } from "../../lib/vulcan-lib/components";
import LoginPopup from "../users/LoginPopup";
import UsersName from "../users/UsersName";
import ContentStyles from "../common/ContentStyles";
import { gql } from '@/lib/generated/gql-codegen';
import { filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';

const elicitBlockDataQuery = gql(`
  query ElicitBlockData($questionId: String) {
    ElicitBlockData(questionId: $questionId) {
      _id
      title
      notes
      resolvesBy
      resolution
      predictions {
        _id,
        predictionId,
        prediction,
        createdAt,
        notes,
        sourceUrl,
        sourceId,
        binaryQuestionId
        creator {
          _id,
          displayName,
          sourceUserId
          lwUser {
            ...UsersMinimumInfo
          }
        }
      }
    }
  }
`);

const elicitPredictionMutation = gql(`
  mutation ElicitPrediction($questionId:String, $prediction: Int) {
    MakeElicitPrediction(questionId:$questionId, prediction: $prediction) {
      _id
      title
      notes
      resolvesBy
      resolution
      predictions {
        _id,
        predictionId,
        prediction,
        createdAt,
        notes,
        sourceUrl,
        sourceId,
        binaryQuestionId
        creator {
          _id,
          displayName,
          sourceUserId
          lwUser {
            ...UsersMinimumInfo
          }
        }
      }
    }
  }
`);

const rootHeight = 50
const rootPaddingTop = 12

const styles = (theme: ThemeType) => ({
  root: {
    position: 'relative',
    paddingTop: rootPaddingTop,
    marginBottom: 0
  },
  histogramRoot: {
    height: rootHeight,
    display: 'flex'
  },
  histogramBucket: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
    '&:hover $sliceColoredArea': {
      backgroundColor: theme.palette.panelBackground.darken15,
    },
    '&:hover $usersInBucket': {
      display: 'block'
    }
  },
  histogramSlice: {
    flexGrow: 1,
    marginTop: 'auto',
    width: '10%',
    height: '100%',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      '& $additionalVoteArea': {
        backgroundColor: theme.palette.panelBackground.darken05,
      },
      '& $sliceColoredArea': {
        backgroundColor: theme.palette.panelBackground.darken20,
      },
      '& $sliceNumber': {
        opacity: 1,
      }
    }
  },
  histogramBucketCurrentUser: {
    '& $sliceColoredArea': {
      backgroundColor: theme.palette.primary.main
    },
    '&:hover $sliceColoredArea': {
      backgroundColor: theme.palette.primary.main
    },
    '&:hover $histogramSliceCurrentUser $sliceColoredArea': {
      backgroundColor: theme.palette.primary.dark
    },
    '& $sliceColoredArea:hover': {
      backgroundColor: theme.palette.primary.dark
    },
    '&:hover $additionalVoteArea': {
      backgroundColor: 'transparent',
      height: '0% !important'
    }
  },
  histogramSliceCurrentUser: {
    '& $sliceColoredArea': {
      backgroundColor: theme.palette.primary.dark
    },
    '&:hover': {
      '& $additionalVoteArea': {
        backgroundColor: 'transparent'
      },
      '& $sliceColoredArea': {
        backgroundColor: theme.palette.primary.dark
      }
    }
  },
  sliceNumber: {
    opacity: 0,
    whiteSpace: 'nowrap',
    position: 'absolute',
    top: -20
  },
  invertedSliceNumber: {
    // This number is right-aligned in the slice (and so overflows left) because
    // if it were left-aligned or centered, it would escape the widget's bounding
    // box on the right side, causing horizontal scrolling
    right: 0
  },
  sliceColoredArea: {
    backgroundColor: theme.palette.panelBackground.darken10,
  },
  additionalVoteArea: {
    marginTop: 'auto',
    position: 'relative'
  },
  titleSection: {
    textAlign: 'center',
    width: '100%',
    color: theme.palette.text.dim60,
    marginTop: 4,
    paddingBottom: 4,
    display: 'flex',
    justifyContent: 'space-between'
  },
  hiddenTitleSection: {
    opacity: 0
  },
  startPercentage: {
    whiteSpace: 'nowrap',
  },
  endPercentage: {
    whiteSpace: 'nowrap'
  },
  title: {
    padding: '0px 10px'
  },
  usersInBucket: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    display: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    color: theme.palette.text.dim60,
    height: `calc(100% - ${rootHeight + rootPaddingTop}px)`,
    paddingTop: 4,
    zIndex: 1 // Ensure that the users are displayed on top of the title element
  },
  name: {
    marginRight: 4
  }
})

const ElicitBlock = ({ classes, questionId = "IyWNjzc5P" }: {
  classes: ClassesType<typeof styles>,
  questionId: string
}) => {
  const currentUser = useCurrentUser();
  const [hideTitle, setHideTitle] = useState(false);
  const {openDialog} = useDialog();

  const { data, loading } = useQuery(elicitBlockDataQuery, { ssr: true, variables: { questionId } });

  const [makeElicitPrediction] = useMutation(elicitPredictionMutation);

  const allPredictions = data?.ElicitBlockData?.predictions || [];
  const nonCancelledPredictions = filterWhereFieldsNotNull(allPredictions, 'prediction');
  const sortedPredictions = sortBy(nonCancelledPredictions, ({prediction}) => prediction)
  const roughlyGroupedData = groupBy(sortedPredictions, ({prediction}) => Math.floor(prediction / 10) * 10)
  const finelyGroupedData = groupBy(sortedPredictions, ({prediction}) => Math.floor(prediction))
  const userHasPredicted = currentUser && some(
    sortedPredictions,
    (prediction: any) => prediction?.creator?.lwUser?._id === currentUser._id
  );
  const [revealed, setRevealed] = useState(false);
  const predictionsHidden = currentUser?.hideElicitPredictions && !userHasPredicted && !revealed;
  
  const maxSize = (maxBy(Object.values(roughlyGroupedData), arr => arr.length) || []).length

  return <ContentStyles contentType="comment" className={classes.root}>
    <div className={classes.histogramRoot}>
      {times(10, (bucket) => <div key={bucket} 
        className={classNames(classes.histogramBucket, {
          [classes.histogramBucketCurrentUser]: roughlyGroupedData[`${bucket*10}`]?.some(({creator}) => currentUser && creator?.sourceUserId === currentUser._id)
        })}
        onMouseEnter={() => roughlyGroupedData[`${bucket*10}`]?.length && setHideTitle(true)}
        onMouseLeave={() => setHideTitle(false)}
      >
        {times(10, offset => {
          const prob = (bucket*10) + offset;
          const isCurrentUserSlice = finelyGroupedData[`${prob}`]?.some(({creator}) => currentUser && creator?.sourceUserId === currentUser._id)
          if (prob === 0) return null
          return <div 
            className={classNames(classes.histogramSlice, {
              [classes.histogramSliceCurrentUser]: isCurrentUserSlice
            })}
            key={prob}
            data-num-largebucket={roughlyGroupedData[`${bucket*10}`]?.length || 0}
            data-num-smallbucket={finelyGroupedData[`${prob}`]?.length || 0}
            onClick={() => {
              if (currentUser && data?.ElicitBlockData?._id) {
                const predictions = data?.ElicitBlockData?.predictions || []
                const filteredPredictions = predictions.filter((prediction: any) => prediction?.creator?.sourceUserId !== currentUser._id)
                // When you click on the slice that corresponds to your current prediction, you cancel it (i.e. double-clicking cancels any current predictions)
                const newPredictions = isCurrentUserSlice ? filteredPredictions : [createNewElicitPrediction(data?.ElicitBlockData?._id, prob, currentUser), ...filteredPredictions]

                setRevealed(true);

                void makeElicitPrediction({
                  variables: { questionId, prediction: !isCurrentUserSlice ? prob : null },
                  optimisticResponse: {
                    __typename: "Mutation",
                    MakeElicitPrediction: {
                      ...data?.ElicitBlockData,
                      __typename: "ElicitBlockData",
                      predictions: newPredictions
                    }
                  }
                })
              } else {
                openDialog({
                  name: "LoginPopup",
                  contents: ({onClose}) => <LoginPopup onClose={onClose} />
                });
              }
            }}
          >
            <div 
              className={classes.additionalVoteArea} 
              style={{height: `${(1 / (maxSize+1))*100 || 0}%`}}
            >
              <div className={classNames(classes.sliceNumber, {[classes.invertedSliceNumber]: prob > 94})}>{prob}%</div>
            </div>
            {!predictionsHidden && <div
              className={classes.sliceColoredArea}
              style={{height: `${(roughlyGroupedData[`${bucket*10}`]?.length / (maxSize+1))*100 || 0}%`}}
            />}
          </div>
        })}
        {!predictionsHidden && roughlyGroupedData[`${bucket*10}`] && <div className={classes.usersInBucket}>
          {roughlyGroupedData[`${bucket*10}`]?.map(({creator, prediction}, i) => <span key={creator?._id} className={classes.name}>
            {creator?.lwUser ? <UsersName user={creator?.lwUser} tooltipPlacement={"bottom"} /> : creator?.displayName} ({prediction}%){i !== (roughlyGroupedData[`${bucket*10}`].length - 1) && ","}
          </span>)}
        </div>}
      </div>)}
    </div>
    
    <div className={classNames(classes.titleSection, {[classes.hiddenTitleSection]: hideTitle})}>
      <div className={classes.startPercentage}>1%</div>
      <div className={classes.title}>
        {data?.ElicitBlockData?.title || (loading ? null : "Can't find Question Title on Elicit")}
        {!loading && predictionsHidden && <a onClick={()=>setRevealed(true)}>
          {" "}(Reveal)
        </a>}
      </div>
      <div className={classes.endPercentage}>99%</div>
    </div>
  </ContentStyles>
}

export default registerComponent('ElicitBlock', ElicitBlock, {
  styles,
  hocs: [withErrorBoundary],
});



function createNewElicitPrediction(questionId: string, prediction: number, currentUser: UsersMinimumInfo) {
  return {
    __typename: "ElicitPrediction" as const,
    _id: randomId(),
    predictionId: randomId(),
    prediction: prediction,
    createdAt: new Date().toISOString(),
    notes: "",
    sourceUrl: elicitSourceURL.get(),
    sourceId: elicitSourceId.get(),
    binaryQuestionId: questionId,
    creator: {
      __typename: "ElicitUser" as const,
      _id: randomId(),
      displayName: currentUser.displayName,
      sourceUserId: currentUser._id, 
      lwUser: currentUser
    }
  }
}
