import React, { useEffect, useMemo, useState } from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import moment from "moment";
import { Link } from "../../../lib/reactRouterWrapper";
import { useCurrentUser } from "../../common/withUser";
import { gql, useQuery } from "@apollo/client";
import { truncatise } from "../../../lib/truncatise";
import { useConcreteThemeOptions } from "../../themes/useTheme";
import InfoIcon from '@material-ui/icons/Info'
import ClockIcon from '@material-ui/icons/Schedule'
import PersonIcon from '@material-ui/icons/Person'
import TopicIcon from '@material-ui/icons/LocalOffer'
import PostIcon from '@material-ui/icons/Description'
import CommentIcon from '@material-ui/icons/Message'
import ShortformIcon from '@material-ui/icons/Notes'
import KarmaIcon from '@material-ui/icons/Star'
import NearMeIcon from '@material-ui/icons/NearMe'
import { RibbonIcon } from "../../icons/ribbonIcon";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useForumWrappedV2 } from "./hooks";
import { userIsAdminOrMod } from "../../../lib/vulcan-users";


const styles = (theme: ThemeType) => ({
  root: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  loading: {
    textAlign: 'center',
  },
  loadingGif: {
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      marginTop: 30
    }
  },
  summaryCard: {
    position: 'relative',
    maxWidth: 640,
    backgroundColor: theme.palette.background.default,
    padding: '32px 14px 20px',
    borderTopLeftRadius: '255px 15px',
    borderTopRightRadius: '15px 225px',
    borderBottomRightRadius: '225px 15px',
    borderBottomLeftRadius: '15px 255px',
    border: `3px solid ${theme.palette.border.primaryTranslucent}`,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      padding: '24px 14px 16px',
    }
  },
  ribbonIcon: {
    position: 'absolute',
    top: -40,
    left: -114,
    width: 220,
    transform: 'rotate(-40deg)',
    fill: theme.palette.primary.main,
    stroke: theme.palette.background.default,
    zIndex: -1
  },
  summaryHeadline: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    columnGap: 5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 600,
    [theme.breakpoints.down('xs')]: {
      fontSize: 22,
    }
  },
  loggedOutSection: {
    maxWidth: 300,
    margin: '20px auto 0'
  },
  unqualifiedUserSection: {
    maxWidth: 435,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    fontSize: 16,
    lineHeight: '24px',
    padding: '0 20px',
    margin: '20px auto 14px'
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: '50% 50%',
    gridGap: '14px 14px',
    fontFamily: theme.typography.fontFamily,
    padding: '0 30px',
    margin: '16px auto 0',
    [theme.breakpoints.down('xs')]: {
      padding: '0 14px',
    },
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    }
  },
  summarySectionTitleRow: {
    padding: '0 30px',
    margin: '20px auto 0',
    [theme.breakpoints.down('xs')]: {
      padding: '0 14px',
    },
  },
  summarySectionTitle: {
    display: 'inline-block',
    fontFamily: theme.typography.fontFamily,
    fontSize: 18,
    lineHeight: '24px',
    paddingBottom: 4,
    borderBottom: theme.palette.border.wrappedSummary,
  },
  summaryData: {
  },
  summaryDataLabel: {
    display: 'flex',
    columnGap: 6,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[900],
    fontSize: 14,
    lineHeight: '18px',
    marginBottom: 8
  },
  labelIcon: {
    fontSize: 16,
    fill: theme.palette.grey[600]
  },
  infoIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  summaryDataVal: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '3px',
    fontFamily: theme.typography.headline.fontFamily,
    color: theme.palette.grey[800],
    fontSize: 16,
    lineHeight: '24px',
    marginBottom: 5
  },
  count: {
    color: theme.palette.grey[600],
    fontSize: 12,
    lineHeight: '16px'
  },
  link: {
    overflowWrap: 'anywhere',
    color: theme.palette.primary.main,
  },
  darkLink: {
    color: theme.palette.primary.dark,
  },
  textSection: {
    margin: '40px 0 0',
  },
  postsListSection: {
  },
  sectionHeadlineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 8
  },
  sectionHeadline: {
    fontSize: 25,
    lineHeight: '32px',
    marginBottom: 8
  },
  mvpLabel: {
    maxWidth: 54,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    fontSize: 12,
    lineHeight: '16px',
    textAlign: 'center'
  },
  body: {
    color: theme.palette.grey[800],
    lineHeight: '22px'
  }
})

const EAForumWrapped2023Page = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()

  const { data, loading } = useForumWrappedV2({
    userId: currentUser?._id,
    year: 2023
  })

  const { SingleColumnSection, Typography, HoverPreviewLink, PostsByVoteWrapper, LoginForm, LWTooltip, Loading } = Components

  if (!data) return null;

  // TODO un-admin gate
  if (!userIsAdminOrMod(currentUser)) {
    return <div className={classes.root}>
      You do not have permission to view this page.
    </div>
  }

  // data is like this:
  // const results: AnyBecauseTodo = {
  //   engagementPercentile,
  //   postsReadCount: posts.length,
  //   totalSeconds,
  //   daysVisited: [], // TODO
  //   mostReadTopics,
  //   relativeMostReadTopics: [], // TODO
  //   relativeLeastReadTopics: [], // TODO
  //   mostReadAuthors,
  //   topPost: userPosts.shift() ?? null,
  //   postCount: userPosts.length,
  //   authorPercentile: 0, // TODO
  //   topComment: userComments.shift() ?? null,
  //   commentCount: userComments.length,
  //   commenterPercentile: 0, // TODO
  //   topShortform: userShortforms.shift() ?? null,
  //   shortformCount: userShortforms.length,
  //   shortformPercentile: 0, // TODO
  //   karmaChange: totalKarmaChange,
  //   postKarmaChanges: [], // TODO
  //   commentKarmaChanges: [], // TODO
  //   mostReceivedReacts: [], // TODO
  // }
  // // TODO change alignment for 2023
  // results['alignment'] = getAlignment(results)
  // return results

  return (
    <AnalyticsContext pageContext="eaYearWrapped">
      <SingleColumnSection>
        <pre>Engagement Percentile: {data.engagementPercentile}</pre>
        <pre>Posts Read Count: {data.postsReadCount}</pre>
        <pre>Total Hours: {(data.totalSeconds / 3600).toFixed(1)}</pre>
        <pre>Days Visited: {JSON.stringify(data.daysVisited, null, 2)}</pre>
        <pre>Most Read Topics: {JSON.stringify(data.mostReadTopics, null, 2)}</pre>
        <pre>Relative Most Read Topics: {JSON.stringify(data.relativeMostReadTopics, null, 2)}</pre>
        <pre>Relative Least Read Topics: {JSON.stringify(data.relativeLeastReadTopics, null, 2)}</pre>
        <pre>Most Read Authors: {JSON.stringify(data.mostReadAuthors, null, 2)}</pre>
        <pre>Top Post: {JSON.stringify(data.topPost, null, 2)}</pre>
        <pre>Post Count: {data.postCount}</pre>
        <pre>Author Percentile: {data.authorPercentile}</pre>
        <pre>Top Comment: {JSON.stringify(data.topComment, null, 2)}</pre>
        <pre>Comment Count: {data.commentCount}</pre>
        <pre>Commenter Percentile: {data.commenterPercentile}</pre>
        <pre>Top Shortform: {JSON.stringify(data.topShortform, null, 2)}</pre>
        <pre>Shortform Count: {data.shortformCount}</pre>
        <pre>Shortform Percentile: {data.shortformPercentile}</pre>
        <pre>Karma Change: {data.karmaChange}</pre>
        <pre>Post Karma Changes: {JSON.stringify(data.postKarmaChanges, null, 2)}</pre>
        <pre>Comment Karma Changes: {JSON.stringify(data.commentKarmaChanges, null, 2)}</pre>
        <pre>Most Received Reacts: {JSON.stringify(data.mostReceivedReacts, null, 2)}</pre>
        <pre>Alignment: {data.alignment}</pre>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const EAForumWrapped2023PageComponent = registerComponent('EAForumWrapped2023Page', EAForumWrapped2023Page, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrapped2023Page: typeof EAForumWrapped2023PageComponent
  }
}
