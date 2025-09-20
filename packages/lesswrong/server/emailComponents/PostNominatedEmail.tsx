import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getNominationPhaseEnd, getReviewNameInSitu, REVIEW_YEAR } from '../../lib/reviewUtils';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import { gql } from "@/lib/generated/gql-codegen";
import { useEmailQuery } from '../vulcan-lib/query';
import { EmailContextType } from './emailContext';

const PostsRevisionQuery = gql(`
  query PostNominatedEmail($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsRevision
      }
    }
  }
`);

export const PostNominatedEmail = async ({documentId, reason, emailContext}: {
  documentId: string,
  reason?: string,
  emailContext: EmailContextType
}) => {
  const { data } = await useEmailQuery(PostsRevisionQuery, {
    variables: { documentId: documentId },
    emailContext
  });
  const post = data?.post?.result;
  if (!post) return null;
  const nominationEndDate = getNominationPhaseEnd(REVIEW_YEAR)

  return (<React.Fragment>
    <p>Your post <a href={postGetPageUrl(post, true)}>{post.title}</a> has received multiple positive votes for the {getReviewNameInSitu()}! On {nominationEndDate.format('MMM Do')}, the nomination vote results will be published, and will be used to help prioritize the Review Phase.</p>
    
    <p>You're encouraged to write a self-review, exploring how you think about the post today. Do you still endorse it? Have you learned anything new that adds more depth? How might you improve the post? What further work do you think should be done exploring the ideas here?</p>
    
    <p>You can write a self-review by going to <a href={postGetPageUrl(post)}>your post</a> and clicking the "Write a Review" button.</p>

    <p>You can see a list of nominated posts over at <a href={`${getSiteUrl()}reviewVoting`}>the Review Dashboard page</a>. Posts with at least one review are sorted to the top.</p>
  </React.Fragment>);
}

