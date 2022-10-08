import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { sectionTitleStyle } from "../common/SectionTitle";

const styles = (theme: ThemeType): JssStyles => ({
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
  const { SingleColumnSection, PostsList2, SectionTitle, LWTooltip } = Components;

  return <SingleColumnSection>
    <LWTooltip title="The Forum Team thinks these posts and threads should stay at the top of the Frontpage for a while" placement="left">
      <SectionTitle title="Debug 3 Posts" noTopMargin className={classes.title} />
    </LWTooltip>
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
