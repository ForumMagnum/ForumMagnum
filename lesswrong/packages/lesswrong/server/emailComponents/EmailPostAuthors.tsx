import React from 'react';
import { registerComponent, Components, getSiteUrl } from '../../lib/vulcan-lib';
import './EmailUsername';

const EmailPostAuthors = ({post}: {
  post: PostsRevision
}) => {
  const { EmailUsername } = Components;
  
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

const EmailPostAuthorsComponent = registerComponent("EmailPostAuthors", EmailPostAuthors);

declare global {
  interface ComponentTypes {
    EmailPostAuthors: typeof EmailPostAuthorsComponent
  }
}
