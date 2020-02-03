import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import './EmailUsername';

const EmailPostAuthors = ({post}) => {
  const { EmailUsername } = Components;
  return <span>by <EmailUsername user={post.user}/>
    {post.coauthors.map((coauthor,i) => [
      ", ", <EmailUsername key={i} user={coauthor}/>
    ])}
  </span>
}

registerComponent("EmailPostAuthors", EmailPostAuthors);
