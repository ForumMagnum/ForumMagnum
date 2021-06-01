import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { sectionTitleStyle } from "../common/SectionTitle";
export const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  },
});

const StickiedPosts = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, PostsList2, SectionTitle, Typography } = Components;

  return <SingleColumnSection className={classes.section}>
    <SectionTitle title={
      <Typography variant='display1' className={classes.title}>
          Pinned Posts
      </Typography>}>
    </SectionTitle>
    <PostsList2
      terms={{view:"stickied"}}
      showNoResults={false}
      showLoadMore={false}
      hideLastUnread={true}
      boxShadow={false}
      curatedIconLeft={true}
    />
  </SingleColumnSection>;
}

const StickiedPostsComponent = registerComponent("StickiedPosts", StickiedPosts, {styles});

declare global {
  interface ComponentTypes {
    StickiedPosts: typeof StickiedPostsComponent
  }
}
