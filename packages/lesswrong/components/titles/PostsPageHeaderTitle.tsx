import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from 'react-helmet';
import { styles } from '../common/HeaderSubtitle';
import { forumTypeSetting } from '../../lib/instanceSettings';

const PostsPageHeaderTitle = ({isSubtitle, siteName, classes}: {
  isSubtitle: boolean,
  siteName: string,
  classes: ClassesType,
}) => {
  const { params: {_id, postId} } = useLocation();
  const { document: post, loading } = useSingle({
    documentId: _id || postId,
    collectionName: "Posts",
    fragmentName: "PostsBase",
    fetchPolicy: 'cache-only',
  });
  
  if (!post || loading) return null;
  const titleString = `${post.title} — ${siteName}`
  
  if (!isSubtitle)
    return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
  
  if (forumTypeSetting.get() !== 'AlignmentForum' && post.af) {
    // TODO: A (broken) bit of an earlier iteration of the header subtitle
    // tried to made AF posts have a subtitle which said "AGI Alignment" and
    // linked to /alignment. But that bit of code was broken, and also that URL
    // is invalid. Maybe make a sensible place for it to link to, then put it
    // back? (alignment-forum.org isn't necessarily good to link to, because
    // it's invite-only.)
    return null;
  } else if (post.frontpageDate) {
    return null;
  } else if (post.userId) {
    // TODO: For personal blogposts, put the user in the sutitle. There was an
    // attempt to do this in a previous implementation, which didn't work.
    return null;
  }
  
  return null;
}

const PostsPageHeaderTitleComponent = registerComponent("PostsPageHeaderTitle", PostsPageHeaderTitle, {styles});

declare global {
  interface ComponentTypes {
    PostsPageHeaderTitle: typeof PostsPageHeaderTitleComponent
  }
}
