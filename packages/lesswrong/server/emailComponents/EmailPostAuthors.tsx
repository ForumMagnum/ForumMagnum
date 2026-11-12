import type { EmailContextType } from './emailContext';
import React from 'react';
import { getSiteUrl } from "../../lib/vulcan-lib/utils";
import { EmailUsername } from './EmailUsername';

export const EmailPostAuthors = ({post, emailContext}: {
  post: PostsRevision,
  emailContext: EmailContextType,
}) => {
  const groupName = post.group ?
    <span>Posted in <a href={`${getSiteUrl(emailContext.resolverContext).slice(0,-1)}/groups/${post.group._id}`}>{post.group.name}</a> </span> :
    null;
  
  return <>
    {groupName}
    <span>by <EmailUsername emailContext={emailContext} user={post.user}/>
      {post.coauthors?.map((coauthor,i) => [
        ", ", <EmailUsername emailContext={emailContext} key={i} user={coauthor}/>
      ])}
    </span>
  </>
}

