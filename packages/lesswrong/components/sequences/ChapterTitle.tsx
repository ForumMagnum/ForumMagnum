import React from 'react';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib';

const isEAForum = forumTypeSetting.get() === "EAForum"


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontSize: isEAForum ? "1.25rem" : "1.4em",
    fontStyle: isEAForum ? "unset" : "italic",
    margin: "1em 0",
  }
});

const ChapterTitle = ({classes, title}: {
  classes: ClassesType,
  title?: string
}) => {
  if (!title) return null
  return  <div className={classes.root}>{title}</div>
}

const ChapterTitleComponent = registerComponent("ChapterTitle", ChapterTitle, {styles});

declare global {
  interface ComponentTypes {
    ChapterTitle: typeof ChapterTitleComponent
  }
}

