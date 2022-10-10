import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { sectionTitleStyle } from "../common/SectionTitle";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit * 3,
    [theme.breakpoints.down("md")]: {
      marginTop: theme.spacing.unit * 1.5,
      marginBottom: theme.spacing.unit,
    }
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
