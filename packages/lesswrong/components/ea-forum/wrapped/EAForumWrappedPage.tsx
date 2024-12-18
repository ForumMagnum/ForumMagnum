import React from "react"
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useLocation } from "@/lib/routeUtil";
import { HEADER_HEIGHT } from "@/components/common/Header";
import { useCurrentUser } from "@/components/common/withUser";
import { makeCloudinaryImageUrl } from "@/components/common/CloudinaryImage2";
import { ForumWrappedProvider, isWrappedYear, useForumWrapped } from "./hooks";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    minHeight: '100vh',
    background: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'center',
    // Compensate for the padding added in Layout.tsx and the site header, so
    // that section starts at the top of the page
    marginTop: -theme.spacing.mainLayoutPaddingTop - HEADER_HEIGHT,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
});

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
    WrappedRecommendationsSection, WrappedMostValuablePostsSection,
  } = Components;
  return (
    <AnalyticsContext pageContext="eaYearWrapped" reviewYear={String(year)}>
      <main className={classes.root}>
        <HeadTags
          title={`EA Forum Wrapped ${year}`}
          image={makeCloudinaryImageUrl("2023_wrapped_wide", {
            dpr: "auto",
            ar: "16:9",
            w: "1200",
            c: "fill",
            g: "center",
            q: "auto",
            f: "auto",
          })}
        />
        <WrappedWelcomeSection year={year} isTooYoung={isTooYoung} />
        {hasWrapped && data &&
          <ForumWrappedProvider year={year} data={data}>
            <WrappedTimeSpentSection />
            <WrappedDaysVisitedSection />
            <WrappedMostReadTopicsSection />
            <WrappedRelativeMostReadTopicsSection />
            <WrappedMostReadAuthorSection />
            <WrappedThankAuthorSection />
            <WrappedPersonalitySection />
            <WrappedTopPostSection />
            <WrappedTopCommentSection />
            <WrappedTopQuickTakeSection />
            <WrappedKarmaChangeSection />
            <WrappedReceivedReactsSection />
            <WrappedThankYouSection />
            <WrappedSummarySection />
            <WrappedRecommendationsSection />
            <WrappedMostValuablePostsSection />
          </ForumWrappedProvider>
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
