import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import './EmailFooterRecommendations';
import { getNominationPhaseEnd, REVIEW_NAME_IN_SITU, REVIEW_YEAR } from '../../lib/reviewUtils';
import moment from 'moment';
import { getSiteUrl } from '../vulcan-lib';


const PostNominatedEmail = ({documentId, reason}: {
  documentId: string,
  reason?: string,
  classes: any,
}) => {
  const { document: post } = useSingle({
    documentId,
    
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  if (!post) return null;
  const nominationEndDate = getNominationPhaseEnd(REVIEW_YEAR)

  return (<React.Fragment>
    <p>Your post <a href={postGetPageUrl(post, true)}>{post.title}</a> has received multiple positive votes for the {REVIEW_NAME_IN_SITU}! On {nominationEndDate.format('MMM Do')}, the nomination vote results will be published, and will be used to help prioritize the Review Phase.</p>
    
    <p>You're encouraged to write a self-review, exploring how you think about the post today. Do you still endorse it? Have you learned anything new that adds more depth? How might you improve the post? What further work do you think should be done exploring the ideas here?</p>
    
    <p>You can write a self-review by going to <a href={postGetPageUrl(post)}>your post</a> and clicking the "Write a Review" button.</p>

    <p>You can see a list of nominated posts over at <a href={`${getSiteUrl()}reviewVoting`}>the Review Dashboard page</a>. Posts with at least one review are sorted to the top.</p>
  </React.Fragment>);
}

const PostNominatedEmailComponent = registerComponent("PostNominatedEmail", PostNominatedEmail);

declare global {
  interface ComponentTypes {
    PostNominatedEmail: typeof PostNominatedEmailComponent
  }
}
