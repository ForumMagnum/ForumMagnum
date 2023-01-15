import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import Card from '@material-ui/core/Card';
import { ReviewYear } from '../../lib/reviewUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 16,
    paddingBottom: 10,
    border: theme.palette.border.commentBorder,
    marginBottom: 16,
    position: "sticky",
    top: -48,
    zIndex: theme.zIndexes.reviewLeaderboard
  },
  username: {
    width: 160,
  },
  karma: {
    width: 45,
  },
  card: {
    width: 400,
    maxHeight: 400
  },
  showAll: {
    color: theme.palette.primary.main,
    marginTop: 16,
    display: "block"
  },
  reviews: {
    width: 510 
  },
  row: {
    marginTop: 4
  }
});

export const ReviewsLeaderboard = ({classes, reviews, reviewYear}: {
  classes: ClassesType,
  reviews?: CommentsListWithParentMetadata[],
  reviewYear?: ReviewYear
}) => {
  const [truncated, setTruncated] = useState<boolean>(true)
  const { UsersNameDisplay, Row, MetaInfo, LWTooltip, CommentsNode } = Components

  const userRows = Object.entries(groupBy(reviews, (review) => review.userId))
  const userRowsMapping = userRows.map(user => ({
      user: user[1][0].user,
      totalKarma: user[1].reduce((value, review) => value + review.baseScore, 0),
      reviews: sortBy(user[1], obj => -obj.baseScore)
  }))
  const sortedUserRows = sortBy(userRowsMapping, obj => -obj.totalKarma)
  const truncatedRows = truncated ? sortedUserRows.slice(0,5) : sortedUserRows

  const totalKarma = reviews?.reduce((v, r) => v + r.baseScore, 0)

  return <div className={classes.root}>
    <Row>
      <h3>Leaderboard</h3>
      {reviews && <div>
        <MetaInfo>{ reviews.length } Reviews</MetaInfo>
        <MetaInfo>{ totalKarma } Karma</MetaInfo>
      </div>}
    </Row>
    {truncatedRows.map(reviewUser => {
      return <div className={classes.row} key={reviewUser.user?._id} >
        <Row justifyContent="flex-start">
          <div className={classes.username}>
            <UsersNameDisplay user={reviewUser.user}/>
          </div>
          <div className={classes.karma}>
            {reviewUser.totalKarma}
          </div>
          <div className={classes.reviews}>{reviewUser.reviews.map(review => {
            return <LWTooltip placement="bottom-start" title={<div className={classes.card}><CommentsNode treeOptions={{showPostTitle: true}} comment={review}/></div>} tooltip={false} key={review._id}>
              <a href={`/reviews/${reviewYear ?? "all"}#${review._id}`} onClick={() => setTruncated(true)}>
                <MetaInfo>{review.baseScore}</MetaInfo>
              </a>
            </LWTooltip>
          })}</div>
        </Row>
      </div>
    })}
    <a className={classes.showAll} onClick={() => setTruncated(!truncated)}>{truncated ? <>Show All Reviewers (5/{sortedUserRows.length})</> : "Show Fewer"}</a>
  </div>
}

const ReviewsLeaderboardComponent = registerComponent('ReviewsLeaderboard', ReviewsLeaderboard, {styles});

declare global {
  interface ComponentTypes {
    ReviewsLeaderboard: typeof ReviewsLeaderboardComponent
  }
}

