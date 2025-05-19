import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isEAForum } from '../../lib/instanceSettings';
import SingleColumnSection from "../common/SingleColumnSection";
import PostsList2 from "../posts/PostsList2";
import TargetedJobAdSection from "./TargetedJobAdSection";

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  return <SingleColumnSection className={classes.root}>
    <PostsList2
      terms={{view:"stickied", limit:100, forum: true}}
      showNoResults={false}
      showLoadMore={false}
      boxShadow={false}
      curatedIconLeft={false}
      placeholderCount={3}
    />
    {/* {isEAForum && <TargetedJobAdSection />} */}
  </SingleColumnSection>
}

export default registerComponent("StickiedPosts", StickiedPosts, {styles});


