import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import times from 'lodash/times';
import groupBy from 'lodash/groupBy';
import maxBy from 'lodash/maxBy';
import { commentBodyStyles } from '../../themes/stylePiping';
import gql from 'graphql-tag';
import { useMutation, useQuery } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';

const elicitDataFragment = `
  _id
  title
  notes
  resolvesBy
  resolution
  predictions {
    _id,
    prediction,
    createdAt,
    notes,
    sourceUrl,
    sourceId,
    binaryQuestionId
    creator {
      _id,
      isQuestionCreator,
      displayName,
      sourceUserId
    }
  }
`

const elicitQuery = gql`
  query ElicitBlockData($questionId: String) {
    ElicitBlockData(questionId: $questionId) {
     ${elicitDataFragment}
    }
  }
`;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme),
    position: 'relative',
    paddingTop: 12
  },
  histogramRoot: {
    height: 50,
    display: 'flex'
  },
  histogramBucket: {
    display: 'flex',
    flexGrow: 1,
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
    height: 23,
    paddingTop: 4
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
  const { data, loading } = useQuery(elicitQuery, { ssr: true, variables: { questionId } })
  const [makeElicitPrediction] = useMutation(gql`
    mutation ElicitPrediction($questionId:String, $prediction: Int) {
      MakeElicitPrediction(questionId:$questionId, prediction: $prediction) {
        ${elicitDataFragment}
      }
    }  
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
          if (prob === 0) return null
          return <div 
            className={classNames(classes.histogramSlice, {
              [classes.histogramSliceCurrentUser]: finelyGroupedData[`${prob}`]?.some(({creator}) => currentUser && creator?.displayName === currentUser.displayName)
            })}
            key={prob}
            data-num-largebucket={roughlyGroupedData[`${bucket*10}`]?.length || 0}
            data-num-smallbucket={finelyGroupedData[`${prob}`]?.length || 0}
            onClick={() => {
              if (currentUser) {
                makeElicitPrediction({
                  variables: { questionId, prediction: prob },
                  optimisticResponse: {
                    __typename: "Mutation",
                    MakeElicitPrediction: {
                      ...data?.ElicitBlockData,
                      __typename: "Mutation",
                      predictions: data?.ElicitBlockData?.predictions?.map(prediction => {
                        if (prediction?.creator?.displayName === currentUser?.displayName) {
                          return {
                            ...prediction,
                            prediction: prob
                          }
                        } else {
                          return prediction
                        }
                      })
                    }
                  }
                })
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
          {roughlyGroupedData[`${bucket*10}`]?.map(({creator, prediction}, i) => <span key={creator?._id} className={classes.name}>
            {creator?.displayName} ({prediction}%){i !== (roughlyGroupedData[`${bucket*10}`].length - 1) && ","}
          </span>)}
        </div>}
      </div>)}
    </div>
    
    <div className={classes.titleSection}>
      <div className={classes.startPercentage}>1%</div>
      <div className={classes.title}>
        {data?.ElicitBlockData?.title}
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

