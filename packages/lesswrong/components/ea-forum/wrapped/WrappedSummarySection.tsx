import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { useForumWrappedContext } from "./hooks";
import {
  formatPercentile,
  formattedKarmaChangeText,
  getUserProfileLink,
} from "./wrappedHelpers";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  summary: {
    width: "100%",
    maxWidth: 400,
    margin: "22px auto 0",
  },
  summaryBoxRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  summaryBox: {
    width: "100%",
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: "10px 12px",
  },
  summaryLabel: {
    textAlign: "left",
    fontSize: 13,
    lineHeight: "normal",
    fontWeight: 500,
  },
  summaryList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
    textAlign: "left",
  },
  summaryListItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 600,
    textWrap: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  summaryTopicIconPlaceholder: {
    width: 16,
    height: 16,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: "17px",
    fontWeight: 500,
    marginTop: 8,
  },
  heading4: {
    fontSize: 24,
    lineHeight: "normal",
    fontWeight: 700,
    letterSpacing: "-0.56px",
    margin: 0,
  },
  mt10: {
    marginTop: 10,
  },
  mt12: {
    marginTop: 12,
  },
});

/**
 * Section that displays a screenshottable summary of the user's Wrapped data
 */
const WrappedSummarySection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data} = useForumWrappedContext();
  const {WrappedSection, UsersProfileImage, CoreTagIcon} = Components;
  return (
    <WrappedSection pageSectionContext="summary">
      <div className={classes.summary}>
        <div className={classes.summaryBoxRow}>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>
                {formatPercentile(data.engagementPercentile)}%
              </div>
              <div className={classes.statLabel}>Top reader</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{(data.totalSeconds / 3600).toFixed(1)}</div>
              <div className={classes.statLabel}>Hours spent</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.daysVisited.length}</div>
              <div className={classes.statLabel}>Days visited</div>
            </article>
          </div>
        </div>
        {!!data.mostReadAuthors.length &&
          <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
            <div className={classes.summaryBox}>
              <div className={classes.summaryLabel}>Most-read authors</div>
              <div className={classNames(classes.summaryList, classes.mt12)}>
                {data.mostReadAuthors.map(author => {
                  return <div key={author.slug} className={classes.summaryListItem}>
                    <UsersProfileImage size={20} user={author} />
                    <Link to={getUserProfileLink(author.slug, year)}>
                      {author.displayName}
                    </Link>
                  </div>
                })}
              </div>
            </div>
          </div>
        }
        {!!data.mostReadTopics.length &&
          <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
            <div className={classes.summaryBox}>
              <div className={classes.summaryLabel}>Most-read topics</div>
              <div className={classNames(classes.summaryList, classes.mt12)}>
                {data.mostReadTopics.map(topic => {
                  return <div key={topic.slug} className={classes.summaryListItem}>
                    <CoreTagIcon tag={topic} fallbackNode={<div className={classes.summaryTopicIconPlaceholder}></div>} />
                    <Link to={tagGetUrl({slug: topic.slug})}>
                      {topic.name}
                    </Link>
                  </div>
                })}
              </div>
            </div>
          </div>
        }
        <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>
                {formattedKarmaChangeText(data.karmaChange)}
              </div>
              <div className={classes.statLabel}>Karma</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.postCount}</div>
              <div className={classes.statLabel}>
                Post{data.postCount === 1 ? "" : "s"}
              </div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.commentCount}</div>
              <div className={classes.statLabel}>
                Comment{data.commentCount === 1 ? "" : "s"}
              </div>
            </article>
          </div>
        </div>
      </div>
    </WrappedSection>
  );
}

const WrappedSummarySectionComponent = registerComponent(
  "WrappedSummarySection",
  WrappedSummarySection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedSummarySection: typeof WrappedSummarySectionComponent
  }
}
