import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import { Card } from "@/components/widgets/Paper";
import { ReviewYear } from '../../lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import UsersNameDisplay from "../users/UsersNameDisplay";
import Row from "../common/Row";
import MetaInfo from "../common/MetaInfo";
import LWTooltip from "../common/LWTooltip";
import CommentsNode from "../comments/CommentsNode";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 16,
    paddingBottom: 10,
    border: theme.palette.border.commentBorder,
    marginBottom: 16
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
    marginTop: 12,
    marginBottom: 12,
    display: "block"
  },
  reviews: {
    width: 510 
  },
  row: {
    marginTop: 4
  },
  currentUser: {
    fontWeight: 600,
    color: theme.palette.grey[900]
  }
});

type ReviewLeaderboardRow = {
  user: UsersMinimumInfo,
  totalKarma: number,
  reviews: CommentsListWithParentMetadata[]
}

export const ReviewsLeaderboard = ({classes, reviews, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviews?: CommentsListWithParentMetadata[],
  reviewYear?: ReviewYear
}) => {
  const currentUser = useCurrentUser()
  const [truncated, setTruncated] = useState<boolean>(true)
  // TODO find the place in the code where this is normally set
  const getSelfUpvotePower = (user: UsersMinimumInfo|null) => {
    if (user?.karma && user?.karma >= 1000) {
      return 2
    } else {
      return 1
    }
  }

  const userRows = Object.entries(groupBy(reviews, (review) => review.userId))
  const userRowsMapping = userRows.map(userTuple => {
    const user = userTuple[1][0].user
    if (!user) {
      return null
    }
    return ({
      user: user,
      totalKarma: userTuple[1].reduce((value, review) => value + (review.baseScore ?? 0) - getSelfUpvotePower(user), 0),
      reviews: sortBy(userTuple[1], obj => -(obj.baseScore ?? 0))
    })}).filter((userRow): userRow is ReviewLeaderboardRow => userRow !== null)

  const NUM_DEFAULT_REVIEWS = 10

  const sortedUserRows = sortBy(userRowsMapping, obj => -obj.totalKarma)
  const truncatedRows = truncated ? sortedUserRows.slice(0,NUM_DEFAULT_REVIEWS) : sortedUserRows

  const totalKarma = reviews?.reduce((v, r) => v + (r.baseScore ?? 0), 0)

  // TODO: move this to a separate component (it's slightly annoying to factor it out which is why we haven't done it yet)
  const reviewLeaderboardRow = (reviewUser: ReviewLeaderboardRow) => {
    if (!reviewUser) {
      return null
    }
    return <div className={classes.row} key={reviewUser.user?._id} >
      <Row justifyContent="flex-start">
        <div className={classNames(classes.username, {
          [classes.currentUser]: reviewUser.user?._id === currentUser?._id
        })}>
          <UsersNameDisplay user={reviewUser.user}/>
        </div>
        <div className={classes.karma}>
          {reviewUser.totalKarma}
        </div>
        <div className={classes.reviews}>{reviewUser.reviews.map(review => {
          return <LWTooltip placement="bottom-start" title={<div className={classes.card}>
            <CommentsNode treeOptions={{showPostTitle: true}} comment={review}/></div>} tooltip={false} key={review._id}>
            <a href={`/reviews/${reviewYear ?? "all"}#${review._id}`} onClick={() => setTruncated(true)}>
              <MetaInfo>{(review.baseScore ?? 0) - getSelfUpvotePower(review.user)}</MetaInfo>
            </a>
          </LWTooltip>
          })}</div>
      </Row>
    </div>
  }

  const currentUserInfo = sortedUserRows.find(userRow => userRow.user?._id === currentUser?._id)
  const currentUserRow = currentUserInfo && truncated && !truncatedRows.find(row => row.user?._id === currentUser?._id) && reviewLeaderboardRow(currentUserInfo)

  return <div className={classes.root}>
    <Row>
      <h3>Leaderboard</h3>
      {reviews && <div>
        <MetaInfo>{ reviews.length } Reviews</MetaInfo>
        <MetaInfo>{ totalKarma } Karma</MetaInfo>
      </div>}
    </Row>
    {truncatedRows.map(reviewUser => {
      return reviewUser && reviewLeaderboardRow(reviewUser)
    })}
    {sortedUserRows.length > NUM_DEFAULT_REVIEWS && <a className={classes.showAll} onClick={() => setTruncated(!truncated)}>{truncated ? <>Show All Reviewers ({NUM_DEFAULT_REVIEWS}/{sortedUserRows.length})</> : "Show Fewer"}</a>}
    {currentUserRow}
  </div>
}

export default registerComponent('ReviewsLeaderboard', ReviewsLeaderboard, {styles});



