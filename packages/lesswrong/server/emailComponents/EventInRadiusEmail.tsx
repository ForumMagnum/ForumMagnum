import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import moment from '../../lib/moment-timezone';
import './EmailPostDate';

const eventTimeFormat = "Do MMMM YYYY h:mm A"

const EventInRadiusEmail = ({openingSentence, postId}: {
  openingSentence: string,
  postId: string,
}) => {
  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsRevision",
  });
  if (loading) return null;
  if (!post) {return null;}
  
  const link = postGetPageUrl(post, true);
  
  return <div>
    <p>
      {openingSentence}: <a href={link}>{post.title}</a>.
    </p>
    <p>
      Location: {post.location}
    </p>
    {!post.localStartTime && !post.localEndTime && <p>Time: TBD</p>}
    {post.localStartTime && <p>
      Start Time: {moment(post.localStartTime).utc().format(eventTimeFormat)}
    </p>}
    {post.localEndTime && <p>
      End Time: {moment(post.localEndTime).utc().format(eventTimeFormat)}
    </p>}
  </div>
}

const EventInRadiusEmailComponent = registerComponent("EventInRadiusEmail", EventInRadiusEmail);

declare global {
  interface ComponentTypes {
    EventInRadiusEmail: typeof EventInRadiusEmailComponent
  }
}
