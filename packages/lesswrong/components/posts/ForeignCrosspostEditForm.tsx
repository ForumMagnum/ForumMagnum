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
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("ForeignCrosspostEditForm", (theme: ThemeType) => ({
  link: {
    color: theme.palette.primary.main,
  },
}));

const PostQuery = gql(`
  query PostQuery($documentId: String) {
    post(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const ForeignCrosspostEditForm = ({post}: {
  post: PostsEditQueryFragment,
}) => {
  const classes = useStyles(styles);
  const url = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `editPost?postId=${post._id}&eventForm=false`);
  const result = useQuery(PostQuery, {
    variables: { documentId: post._id },
  });
  const postWithContent = result.data?.post?.result;
  if (!postWithContent) return <Loading/>

  return (<>
    <StatusCodeSetter status={200}/>
    <SingleColumnSection>
      <PostsPagePostHeader post={postWithContent} hideMenu hideTags />
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

export default ForeignCrosspostEditForm;


