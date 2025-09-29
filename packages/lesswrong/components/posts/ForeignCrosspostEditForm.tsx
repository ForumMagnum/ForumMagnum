import React from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../lib/instanceSettings";
import { Link } from "../../lib/reactRouterWrapper";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { combineUrls } from "../../lib/vulcan-lib/utils";
import SingleColumnSection from "../common/SingleColumnSection";
import PostsPagePostHeader from "./PostsPage/PostsPagePostHeader";
import { Typography } from "../common/Typography";
import { StatusCodeSetter } from "../next/StatusCodeSetter";

const styles = (theme: ThemeType) => ({
  link: {
    color: theme.palette.primary.main,
  },
});

const ForeignCrosspostEditForm = ({post, classes}: {
  post: PostsPage,
  classes: ClassesType<typeof styles>,
}) => {
  const url = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `editPost?postId=${post._id}&eventForm=false`);

  const postWithNavigation: PostsWithNavigation = {
    ...post,
    podcastEpisode: null,
    tableOfContents: null,
    sequence: null,
    prevPost: null,
    nextPost: null,
    reviewWinner: null,
    glossary: [],
  };

  return (<>
    <StatusCodeSetter status={200}/>
    <SingleColumnSection>
      <PostsPagePostHeader post={postWithNavigation} hideMenu hideTags />
      <Typography variant="body2" gutterBottom>
        This post cannot be edited as it is a crosspost.{' '}
        <a href={url} className={classes.link}>Click here</a> to edit on{' '}
        {fmCrosspostSiteNameSetting.get()}.
      </Typography>
      {post.draft && <Typography variant="body2">
        This crosspost is a draft. Crosspost drafts cannot be undrafted. You
        will need to{' '}
        <Link to='/contact' className={classes.link}>
          contact a site admin
        </Link>{' '}
        for help. Sorry about that!
      </Typography>}
    </SingleColumnSection>
  </>);
}

export default registerComponent("ForeignCrosspostEditForm", ForeignCrosspostEditForm, {styles});


