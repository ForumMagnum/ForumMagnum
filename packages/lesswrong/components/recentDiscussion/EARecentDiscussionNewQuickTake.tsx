import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import EARecentDiscussionItem from "./EARecentDiscussionItem";
import CommentsItem from "../comments/CommentsItem/CommentsItem";

const styles = (_theme: ThemeType) => ({
  body: {
    padding: 0,
    "& .CommentsItemMeta-root": {
      paddingTop: 0,
      "& .CommentsItemMeta-rightSection": {
        top: 0,
      },
    },
    "& .CommentsItem-bottom": {
      paddingBottom: 0,
    },
  },
});

const EARecentDiscussionNewQuickTake = ({
  quickTake,
  refetch,
  classes,
}: {
  quickTake: QuickTakesRecentDiscussion,
  refetch: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <EARecentDiscussionItem
      icon="CommentFilled"
      iconVariant="grey"
      user={quickTake.user}
      action="posted a"
      postTitleOverride="Quick Take"
      postUrlOverride={commentGetPageUrl(quickTake)}
      post={quickTake.post ?? undefined}
      timestamp={quickTake.postedAt}
    >
      <CommentsItem
        treeOptions={{refetch, condensed: true}}
        comment={quickTake}
        nestingLevel={1}
        truncated={false}
        excerptLines={(quickTake.descendentCount ?? 0) > 1 ? 3 : 20}
        className={classes.body}
      />
    </EARecentDiscussionItem>
  );
}

export default registerComponent(
  "EARecentDiscussionNewQuickTake",
  EARecentDiscussionNewQuickTake,
  {styles, stylePriority: 2},
);
