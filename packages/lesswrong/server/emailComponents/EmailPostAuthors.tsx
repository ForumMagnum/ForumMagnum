import React from 'react';
import { getSiteUrl } from "../../lib/vulcan-lib/utils";
import { EmailUsername } from './EmailUsername';

export const EmailPostAuthors = ({post}: {
  post: PostsRevision
}) => {
  const groupName = post.group ?
    <span>Posted in <a href={`${getSiteUrl().slice(0,-1)}/groups/${post.group._id}`}>{post.group.name}</a> </span> :
    null;
  
  return <>
    {groupName}
    <span>by <EmailUsername user={post.user}/>
      {post.coauthors?.map((coauthor,i) => [
        ", ", <EmailUsername key={i} user={coauthor}/>
      ])}
    </span>
  </>
}

