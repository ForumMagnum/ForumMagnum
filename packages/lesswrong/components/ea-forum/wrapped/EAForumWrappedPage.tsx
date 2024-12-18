import React, { FC } from "react"
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useLocation } from "@/lib/routeUtil";
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from "@/components/common/Header";
import { useCurrentUser } from "@/components/common/withUser";
import { makeCloudinaryImageUrl } from "@/components/common/CloudinaryImage2";
import { ForumWrappedProvider, isWrappedYear, useForumWrapped } from "./hooks";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    minHeight: "100vh",
    maxHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
    background: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    textAlign: "center",
    // Compensate for the padding added in Layout.tsx and the site header, so
    // that section starts at the top of the page
    marginTop: -HEADER_HEIGHT - theme.spacing.mainLayoutPaddingTop,
    paddingTop: HEADER_HEIGHT + theme.spacing.mainLayoutPaddingTop,
    [theme.breakpoints.down("md")]: {
      marginTop: -HEADER_HEIGHT,
      paddingTop: HEADER_HEIGHT,
    },
    [theme.breakpoints.down("xs")]: {
      marginTop: -MOBILE_HEADER_HEIGHT,
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
    [theme.breakpoints.down("sm")]: {
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

  const sections = [
    Components.WrappedWelcomeSection,
    Components.WrappedTimeSpentSection,
    Components.WrappedDaysVisitedSection,
    Components.WrappedMostReadTopicsSection,
    Components.WrappedRelativeMostReadTopicsSection,
    Components.WrappedMostReadAuthorSection,
    Components.WrappedThankAuthorSection,
    Components.WrappedPersonalitySection,
    Components.WrappedTopPostSection,
    Components.WrappedTopCommentSection,
    Components.WrappedTopQuickTakeSection,
    Components.WrappedKarmaChangeSection,
    Components.WrappedReceivedReactsSection,
    Components.WrappedThankYouSection,
    Components.WrappedSummarySection,
    Components.WrappedRecommendationsSection,
    Components.WrappedMostValuablePostsSection,
  ] as FC[];

  const {HeadTags, WrappedSection, WrappedHeading,LoginForm, WrappedApp} = Components;
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
        {isLoggedOut &&
          <WrappedSection pageSectionContext="loggedOut">
            <WrappedHeading>
              Login to view your {year} EA Forum <em>Wrapped</em>
            </WrappedHeading>
            <LoginForm />
          </WrappedSection>
        }
        {isTooYoung &&
          <WrappedSection pageSectionContext="tooYoung">
            <WrappedHeading>
              {year} EA Forum <em>Wrapped</em>
            </WrappedHeading>
            <div>
              Looks like you didn't have an account in {year} - check back in
              at the end of this year
            </div>
          </WrappedSection>
        }
        {!isLoggedOut && !isTooYoung && data &&
          <ForumWrappedProvider
            year={year}
            data={data}
            currentUser={currentUser}
            sections={sections}
          >
            <WrappedApp />
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
