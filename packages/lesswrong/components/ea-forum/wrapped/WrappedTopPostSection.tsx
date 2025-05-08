import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { formatPercentile } from "./wrappedHelpers";
import { useForumWrappedContext } from "./hooks";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";
import { WrappedPost } from "./WrappedPost";

const styles = (_theme: ThemeType) => ({
  topPost: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 380,
    margin: "24px auto",
  },
  container: {
    width: "100%",
    marginBottom: 24,
  },
  nextTopPosts: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: 380,
    margin: "10px auto 0",
  },
  textRow: {
    maxWidth: 500,
    textWrap: 'pretty',
    margin: '0 auto',
  },
});

/**
 * Section that displays the user's highest-karma post plus other data on their posts
 */
const WrappedTopPostSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data} = useForumWrappedContext();
  const percentile = formatPercentile(data.authorPercentile);
  return (
    <WrappedSection pageSectionContext="topPost">
      <WrappedHeading>
        Your highest-karma <em>post</em> in {year}
      </WrappedHeading>
      <div className={classes.topPost}>
        <WrappedPost post={data.topPosts[0]} />
      </div>
      {data.topPosts.length > 1 &&
        <div className={classes.container}>
          <div>
            Other posts you wrote this year...
          </div>
          <div className={classes.nextTopPosts}>
            {data.topPosts.slice(1).map((post) => (
              <WrappedPost key={post._id} post={post} />
            ))}
          </div>
        </div>
      }
      <div className={classes.textRow}>
        You wrote {data.postCount} post{data.postCount === 1 ? "" : "s"} in
        total this year.
        {percentile < 100 &&
          ` This means you're in the top ${percentile}% of post authors.`
        }
      </div>
    </WrappedSection>
  );
}

export const WrappedTopPostSection = registerComponent(
  "WrappedTopPostSection",
  WrappedTopPostSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedTopPostSection: typeof WrappedTopPostSection
  }
}
