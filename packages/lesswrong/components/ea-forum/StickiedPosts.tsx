import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: isFriendlyUI
    ? {
      margin: "8px 0",
    }
    : {
      marginBottom: 24,
      [theme.breakpoints.down("md")]: {
        marginTop: 12,
        marginBottom: 8,
      }
    },
});

const StickiedPosts = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, PostsList2, TargetedJobAdSection } = Components

  return <SingleColumnSection className={classes.root}>
    <PostsList2
      terms={{view:"stickied", limit:100, forum: true}}
      showNoResults={false}
      showLoadMore={false}
      hideLastUnread={false}
      boxShadow={false}
      curatedIconLeft={false}
    />
    {isEAForum && <TargetedJobAdSection />}
  </SingleColumnSection>
}

const StickiedPostsComponent = registerComponent("StickiedPosts", StickiedPosts, {styles});

declare global {
  interface ComponentTypes {
    StickiedPosts: typeof StickiedPostsComponent
  }
}
