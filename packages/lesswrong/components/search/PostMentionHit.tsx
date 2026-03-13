import React from "react";
import { isFriendlyUI } from "@/themes/forumTheme";
import ForumIcon from "../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("PostMentionHit", (theme: ThemeType) => ({
  root: {
    ...(theme.isFriendlyUI && {
      display: "block",
      maxWidth: 500,
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
}));

const PostMentionHit = ({hit}: {
  hit: SearchPost,
}) => {
  const classes = useStyles(styles);
  const icon = isFriendlyUI()
    ? <ForumIcon icon="Document" className={classes.icon} />
    : "📃";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.title}</span>
    </span>
  );
}

export default PostMentionHit;


