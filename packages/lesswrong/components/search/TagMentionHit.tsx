import React from "react";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TagMentionHit", (theme: ThemeType) => ({
  root: {
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
}));

const TagMentionHit = ({hit}: {
  hit: SearchTag,
}) => {
  const icon = "🏷️";
  const classes = useStyles(styles);
  return (
    <span className={classes.root}>
      {icon} <span>{hit.name}</span>
    </span>
  );
}

export default TagMentionHit;


