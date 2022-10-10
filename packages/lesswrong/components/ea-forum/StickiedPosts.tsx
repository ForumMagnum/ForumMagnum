import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { sectionTitleStyle } from "../common/SectionTitle";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [theme.breakpoints.down("md")]: {
      marginTop: 12,
      marginBottom: 10,
    }
  },
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto",
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing.unit*3,
    },
  },
});

const StickiedPosts = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, PostsList2 } = Components;

  return <SingleColumnSection className={classes.root}>
    <PostsList2
      terms={{view:"stickied", limit:100, forum: true}}
      showNoResults={false}
      showLoadMore={false}
      hideLastUnread={false}
      boxShadow={false}
      curatedIconLeft={false}
    />
  </SingleColumnSection>;
}

const StickiedPostsComponent = registerComponent("StickiedPosts", StickiedPosts, {styles});

declare global {
  interface ComponentTypes {
    StickiedPosts: typeof StickiedPostsComponent
  }
}
