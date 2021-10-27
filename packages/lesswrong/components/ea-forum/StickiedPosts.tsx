import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { sectionTitleStyle } from "../common/SectionTitle";

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto",
  },
});

const StickiedPosts = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, PostsList2, SectionTitle } = Components;

  return <SingleColumnSection className={classes.section}>
    <SectionTitle title="Pinned Posts" className={classes.title} />
    <PostsList2
      terms={{view:"stickied", limit:100}}
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
