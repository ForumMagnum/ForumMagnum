import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../lib/instanceSettings";

const styles = (theme: ThemeType): JssStyles => ({
  link: {
    color: theme.palette.primary.main,
  },
});

const ForeignCrosspostEditForm = ({post, classes}: {
  post: PostsWithNavigation,
  classes: ClassesType,
}) => {
  const {SingleColumnSection, PostsPagePostHeader, Typography} = Components;

  const url = `${fmCrosspostBaseUrlSetting.get()}editPost?postId=${post._id}&eventForm=false`;

  return (
    <SingleColumnSection>
      <PostsPagePostHeader post={post} hideMenu hideTags />
      <Typography variant="body2">
        This post cannot be edited as it is a crosspost. <a href={url} className={classes.link}>Click here</a> to edit on {fmCrosspostSiteNameSetting.get()}.
      </Typography>
    </SingleColumnSection>
  );
}

const ForeignCrosspostEditFormComponent = registerComponent("ForeignCrosspostEditForm", ForeignCrosspostEditForm, {styles});

declare global {
  interface ComponentTypes {
    ForeignCrosspostEditForm: typeof ForeignCrosspostEditFormComponent
  }
}
