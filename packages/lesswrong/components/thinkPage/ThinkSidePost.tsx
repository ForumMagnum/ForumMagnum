// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useDynamicTableOfContents } from '../hooks/useDynamicTableOfContents';

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.faint,
    padding: theme.spacing.unit * 1.5,
    marginBottom: theme.spacing.unit,
    borderRadius: 3,
    marginTop: theme.spacing.unit,
  },
  section: {
    marginBottom: theme.spacing.unit,
    '&:first-of-type': {
      marginTop: 0,
      fontWeight: 'bold',
    }
  }
});

export const ThinkSidePost = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage
}) => {
  const { FixedPositionToC } = Components;

  const sectionData = useDynamicTableOfContents({
    html: post?.contents?.html ?? post?.contents?.htmlHighlight ?? "",
    post,
    answers: [],
  });
  const htmlWithAnchors = sectionData
  
  if (!sectionData?.sections) return null;
  return <div className={classes.root}>
    {sectionData.sections.map((section, index) => (
      <div key={index} className={classes.section}>{section.title}</div>
    ))}
  </div>;
}

const ThinkSidePostComponent = registerComponent('ThinkSidePost', ThinkSidePost, {styles});

declare global {
  interface ComponentTypes {
    ThinkSidePost: typeof ThinkSidePostComponent
  }
}
