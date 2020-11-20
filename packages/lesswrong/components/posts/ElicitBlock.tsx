import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import times from 'lodash/times';
import groupBy from 'lodash/groupBy';
import maxBy from 'lodash/maxBy';
import { commentBodyStyles } from '../../themes/stylePiping';
import gql from 'graphql-tag';
import { useMutation, useQuery } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import { randomId } from '../../lib/random';
import { elicitSourceId, elicitSourceURL } from '../../lib/publicSettings';
import { useDialog } from '../common/withDialog';

const elicitDataFragment = `
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
`

const elicitQuery = gql`
  query ElicitBlockData($questionId: String) {
    ElicitBlockData(questionId: $questionId) {
     ${elicitDataFragment}
    }
  }
  ${getFragment("UsersMinimumInfo")}
`;

const rootHeight = 50
const rootPaddingTop = 12

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme),
    position: 'relative',
    paddingTop: rootPaddingTop
  },
  histogramRoot: {
    height: rootHeight,
    display: 'flex'
  },
  histogramBucket: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    '&:hover $sliceColoredArea': {
      backgroundColor: "rgba(0,0,0,0.15)"
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
        backgroundColor: "rgba(0,0,0,0.05)"
      },
      '& $sliceColoredArea': {
        backgroundColor: "rgba(0,0,0,0.2)"
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
  sliceColoredArea: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  additionalVoteArea: {
    marginTop: 'auto',
    position: 'relative'
  },
  titleSection: {
    textAlign: 'center',
    width: '100%',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 4,
    display: 'flex',
    justifyContent: 'space-between'
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
    backgroundColor: 'white',
    color: 'rgba(0,0,0,0.6)',
    height: `calc(100% - ${rootHeight + rootPaddingTop}px)`,
    paddingTop: 5
  },
  name: {
    marginRight: 4
  }
})

const ElicitBlock = ({ classes, questionId = "IyWNjzc5P" }: {
  classes: ClassesType,
  questionId: String
}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const { UsersName } = Components;
  const { data, loading } = useQuery(elicitQuery, { ssr: true, variables: { questionId } })
  const [makeElicitPrediction] = useMutation(gql`
    mutation ElicitPrediction($questionId:String, $prediction: Int) {
      MakeElicitPrediction(questionId:$questionId, prediction: $prediction) {
        ${elicitDataFragment}
      }
    }
    ${getFragment("UsersMinimumInfo")}  
  `);
  
  const roughlyGroupedData = groupBy(data?.ElicitBlockData?.predictions || [], ({prediction}) => Math.floor(prediction / 10) * 10)
  const finelyGroupedData = groupBy(data?.ElicitBlockData?.predictions || [], ({prediction}) => prediction)
  const maxSize = (maxBy(Object.values(roughlyGroupedData), arr => arr.length) || []).length

  return <div className={classes.root}>
    <div className={classes.histogramRoot}>
      {times(10, (bucket) => <div key={bucket} className={classNames(classes.histogramBucket, {
        [classes.histogramBucketCurrentUser]: roughlyGroupedData[`${bucket*10}`]?.some(({creator}) => currentUser && creator?.displayName === currentUser.displayName)
      })}>
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
              if (currentUser) {
                const predictions = data?.ElicitBlockData?.predictions || []
                const filteredPredictions = predictions.filter(prediction => prediction?.creator?.sourceUserId !== currentUser._id)
                // When you click on the slice that corresponds to your current prediction, you cancel it (i.e. double-clicking cancels any current predictions)
                const newPredictions = isCurrentUserSlice ? filteredPredictions : [createNewElicitPrediction(data?.ElicitBlockData?._id, prob, currentUser), ...filteredPredictions]

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
                  componentName: "LoginPopup",
                  componentProps: {}
                });
              }
            }}
          >
            <div 
              className={classes.additionalVoteArea} 
              style={{height: `${(1 / (maxSize+1))*100 || 0}%`}}
            >
              <div className={classes.sliceNumber}>{prob}%</div>
            </div>
            <div 
              className={classes.sliceColoredArea}
              style={{height: `${(roughlyGroupedData[`${bucket*10}`]?.length / (maxSize+1))*100 || 0}%`}}
            />
          </div>
        })}
        {roughlyGroupedData[`${bucket*10}`] && <div className={classes.usersInBucket}>
          {roughlyGroupedData[`${bucket*10}`]?.map(({creator, prediction, sourceId}, i) => <span key={creator?._id} className={classes.name}>
            {creator?.lwUser ? <UsersName user={creator?.lwUser} /> : creator?.displayName} ({prediction}%){i !== (roughlyGroupedData[`${bucket*10}`].length - 1) && ","}
          </span>)}
        </div>}
      </div>)}
    </div>
    
    <div className={classes.titleSection}>
      <div className={classes.startPercentage}>1%</div>
      <div className={classes.title}>
        {data?.ElicitBlockData?.title || (loading ? null : "Can't find Question Title on Elicit")}
      </div>
      <div className={classes.endPercentage}>99%</div>
    </div>
  </div>
    
}

const ElicitBlockComponent = registerComponent('ElicitBlock', ElicitBlock, { styles });

declare global {
  interface ComponentTypes {
    ElicitBlock: typeof ElicitBlockComponent
  }
}

function createNewElicitPrediction(questionId: string, prediction: number, currentUser: UsersMinimumInfo) {
  return {
    __typename: "ElicitPrediction",
    _id: randomId(),
    predictionId: randomId(),
    prediction: prediction,
    createdAt: new Date(),
    notes: "",
    sourceUrl: elicitSourceURL.get(),
    sourceId: elicitSourceId.get(),
    binaryQuestionId: questionId,
    creator: {
      __typename: "ElicitUser",
      _id: randomId(),
      displayName: currentUser.displayName,
      sourceUserId: currentUser._id, 
      lwUser: currentUser
    }
  }
}
