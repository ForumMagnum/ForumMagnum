import React from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import {
  WrappedYear,
  isWrappedYear,
  useForumWrapped,
} from "./hooks";
import classNames from "classnames";
import moment from "moment";
import { HEADER_HEIGHT } from "../../common/Header";
import {
  CloudinaryPropsType,
  makeCloudinaryImageUrl,
} from "../../common/CloudinaryImage2";
import { useLocation } from "../../../lib/routeUtil";
import DeferRender from "@/components/common/DeferRender";

const socialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const styles = (theme: ThemeType) => ({
  root: {
    minHeight: '100vh',
    background: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'center',
    // compensate for the padding added in Layout.tsx and the site header, so
    // that section starts at the top of the page
    marginTop: -theme.spacing.mainLayoutPaddingTop - HEADER_HEIGHT,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  '@keyframes section-scroll-animation': {
    '0%': {
      opacity: 0,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    }
  },
  section: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '55vh',
    padding: '75px 40px',
    // Fade sections in and out if possible (i.e. on Chrome)
    '@supports (animation-timeline: view())': {
      animation: 'section-scroll-animation linear',
      animationTimeline: 'view()',
    },
    // If not, then make them taller so that they don't distract from the
    // focused section
    '@supports not (animation-timeline: view())': {
      minHeight: '80vh',
    },
    '&:first-of-type': {
      minHeight: '85vh',
      paddingTop: 140,
    },
    '&:last-of-type': {
      minHeight: '85vh',
      paddingBottom: 200,
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  sectionTall: {
    minHeight: '85vh',
  },
  sectionNoFade: {
    // Don't fade the "most valuable posts" section since it can be very tall
    '@supports (animation-timeline: view())': {
      animation: 'none',
      animationTimeline: 'none',
    },
  },
  heartIcon: {
    marginLeft: 1,
    '& svg': {
      width: 28,
      height: 20
    }
  },
  lightbulbIcon: {
    width: 120,
  },
  stats: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    margin: '0 auto',
  },
  stat: {
    flex: 'none',
    width: 100
  },
  statLabel: {
    fontSize: 13,
    lineHeight: '17px',
    fontWeight: 500,
    marginTop: 8
  },
  mvpColLabels: {
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    justifyContent: 'space-between',
  },
  mvpUpvotesLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
  mvpHeartLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 13,
    fontWeight: 500,
    paddingRight: 20
  },
  mvpHeartIcon: {
    fontSize: 16
  },
  mvpList: {
    width: '100%',
    maxWidth: 500,
    textAlign: 'left',
    '& .LoadMore-root': {
      color: theme.palette.text.alwaysWhite,
    },
    '& .Loading-spinner': {
      margin: '10px 0 0'
    }
  },
  mvpPostItem: {
    marginBottom: 4,
    '& .EAPostsItem-expandedCommentsWrapper': {
      background: theme.palette.text.alwaysWhite,
      border: 'none',
      "&:hover": {
        background: theme.palette.text.alwaysWhite,
        border: 'none',
        opacity: 0.9
      },
    },
    '& .PostsTitle-root': {
      color: theme.palette.wrapped.black,
    },
    '& .PostsTitle-read': {
      color: theme.palette.wrapped.black,
    },
    '& .PostsItemIcons-icon': {
      color: theme.palette.wrapped.grey,
    },
    '& .PostsItemIcons-linkIcon': {
      color: theme.palette.wrapped.grey,
    },
    '& .EAKarmaDisplay-root': {
      color: theme.palette.wrapped.grey,
    },
    '& .EAKarmaDisplay-voteArrow': {
      color: theme.palette.wrapped.postScoreArrow,
    },
    '& .EAPostMeta-root': {
      color: theme.palette.wrapped.grey,
    },
    '& .PostsItem2MetaInfo-metaInfo': {
      color: theme.palette.wrapped.grey,
    },
  },
  heading2: {
    fontSize: 32,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.72px',
  },
  heading3: {
    fontSize: 28,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.56px',
    textDecorationLine: 'none',
    margin: 0
  },
  heading4: {
    fontSize: 24,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.56px',
    margin: 0
  },
  heading5: {
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    margin: 0
  },
  textRow: {
    maxWidth: 500,
  },
  text: {
    fontSize: 14,
    lineHeight: '21px',
    fontWeight: 500,
    color: theme.palette.text.alwaysWhite,
  },
  highlight: {
    color: theme.palette.wrapped.highlightText,
  },
  link: {
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    '&:hover': {
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    }
  },
  balance: {
    textWrap: 'balance'
  },
  nowrap: {
    textWrap: 'nowrap'
  },
  m0: { margin: 0 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt26: { marginTop: 26 },
  mt30: { marginTop: 30 },
  mt40: { marginTop: 40 },
  mt60: { marginTop: 60 },
  mt70: { marginTop: 70 },
  mt100: { marginTop: 100 },
})

/**
 * Section that displays all the user's upvoted posts and lets them mark which were "most valuable"
 */
const MostValuablePostsSection = ({year, classes}: {
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  const { ForumIcon, PostsByVoteWrapper } = Components

  return <AnalyticsContext pageSectionContext="mostValuablePosts">
    <section className={classNames(classes.section, classes.sectionNoFade)}>
      <h1 className={classes.heading3}>
        Which posts from {year} were most valuable for you?
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt16)}>
        These are your upvotes from {year}. Your choice of the most valuable posts will be really useful
        for helping us decide what to feature on the Forum. (We’ll only look at anonymized data.)
      </p>
      <div className={classNames(classes.mvpColLabels, classes.mt30)}>
        <div className={classes.mvpUpvotesLabel}>Your upvotes</div>
        <div className={classes.mvpHeartLabel}>
          Most valuable
          <ForumIcon icon="HeartOutline" className={classes.mvpHeartIcon} />
        </div>
      </div>
      <DeferRender ssr={false}>
        <div className={classNames(classes.mvpList, classes.mt10)}>
          <PostsByVoteWrapper voteType="bigUpvote" year={year} postItemClassName={classes.mvpPostItem} showMostValuableCheckbox hideEmptyStateText />
          <PostsByVoteWrapper voteType="smallUpvote" year={year} limit={10} postItemClassName={classes.mvpPostItem} showMostValuableCheckbox hideEmptyStateText />
        </div>
      </DeferRender>
    </section>
  </AnalyticsContext>
}

const EAForumWrappedPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const {params} = useLocation();
  const currentUser = useCurrentUser();

  const rawYear = parseInt(params.year);
  const year = isWrappedYear(rawYear) ? rawYear : 2024;

  const {data} = useForumWrapped({
    userId: currentUser?._id,
    year,
  });

  const isLoggedOut = !currentUser;
  const userCreatedAt = moment(currentUser?.createdAt);
  const endOfYear = moment(`${year}-12-31`, "YYYY-MM-DD");
  const isTooYoung = userCreatedAt.isAfter(endOfYear, "date");
  const hasWrapped = !isLoggedOut && !isTooYoung;

  const {
    HeadTags, WrappedWelcomeSection, WrappedTimeSpentSection,
    WrappedDaysVisitedSection, WrappedMostReadTopicsSection,
    WrappedRelativeMostReadTopicsSection, WrappedMostReadAuthorSection,
    WrappedThankAuthorSection, WrappedPersonalitySection, WrappedTopPostSection,
    WrappedTopCommentSection, WrappedTopQuickTakeSection, WrappedKarmaChangeSection,
    WrappedReceivedReactsSection, WrappedThankYouSection, WrappedSummarySection,
    WrappedRecommendationsSection,
  } = Components;
  return (
    <AnalyticsContext pageContext="eaYearWrapped" reviewYear={String(year)}>
      <main className={classes.root}>
        <HeadTags
          title={`EA Forum Wrapped ${year}`}
          image={makeCloudinaryImageUrl("2023_wrapped_wide", socialImageProps)}
        />
        <WrappedWelcomeSection year={year} isTooYoung={isTooYoung} />
        {hasWrapped && data &&
          <>
            <WrappedTimeSpentSection data={data} year={year} />
            <WrappedDaysVisitedSection daysVisited={data.daysVisited} year={year} />
            <WrappedMostReadTopicsSection mostReadTopics={data.mostReadTopics} />
            <WrappedRelativeMostReadTopicsSection
              relativeMostReadCoreTopics={data.relativeMostReadCoreTopics}
            />
            <WrappedMostReadAuthorSection
              authors={data.mostReadAuthors}
              postCount={data.postCount}
              year={year}
            />
            <WrappedThankAuthorSection authors={data.mostReadAuthors} year={year} />
            <WrappedPersonalitySection />
            <WrappedTopPostSection data={data} year={year} />
            <WrappedTopCommentSection data={data} year={year} />
            <WrappedTopQuickTakeSection data={data} year={year} />
            <WrappedKarmaChangeSection data={data} />
            <WrappedReceivedReactsSection receivedReacts={data.mostReceivedReacts} />
            <WrappedThankYouSection year={year} />
            <WrappedSummarySection data={data} year={year} />
            <WrappedRecommendationsSection />
            <MostValuablePostsSection year={year} classes={classes} />
          </>
        }
      </main>
    </AnalyticsContext>
  )
}

const EAForumWrappedPageComponent = registerComponent(
  "EAForumWrappedPage",
  EAForumWrappedPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAForumWrappedPage: typeof EAForumWrappedPageComponent
  }
}
