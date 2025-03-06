import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { formatPercentile } from "./wrappedHelpers";
import { useForumWrappedContext } from "./hooks";
import WrappedSection from "@/components/ea-forum/wrapped/WrappedSection";
import WrappedHeading from "@/components/ea-forum/wrapped/WrappedHeading";
import WrappedComment from "@/components/ea-forum/wrapped/WrappedComment";

const styles = (_theme: ThemeType) => ({
  topComment: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 380,
    margin: "24px auto",
  },
  textRow: {
    maxWidth: 500,
    textWrap: 'pretty',
    margin: '0 auto',
  },
});

const WrappedTopCommentSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data} = useForumWrappedContext();
  const percentile = formatPercentile(data.commenterPercentile);
  return (
    <WrappedSection pageSectionContext="topComment">
      <WrappedHeading>
        Your highest-karma <em>comment</em> in {year}
      </WrappedHeading>
      <div className={classes.topComment}>
        <WrappedComment comment={data.topComment} />
      </div>
      <div className={classes.textRow}>
        You wrote {data.commentCount}{" "}
        comment{data.commentCount === 1 ? "" : "s"} in total this year.
        {percentile < 100 &&
          ` This means you're in the top ${percentile}% of commenters.`
        }
      </div>
    </WrappedSection>
  );
}

const WrappedTopCommentSectionComponent = registerComponent(
  "WrappedTopCommentSection",
  WrappedTopCommentSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedTopCommentSection: typeof WrappedTopCommentSectionComponent
  }
}

export default WrappedTopCommentSectionComponent;
