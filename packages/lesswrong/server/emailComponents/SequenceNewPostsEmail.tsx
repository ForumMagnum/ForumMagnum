import React from 'react';
import { postGetAbsolutePageUrl } from '../../lib/collections/posts/helpers';
import { makeCloudinaryImageUrl } from '@/components/common/cloudinaryHelpers';
import { sequenceGetAbsolutePageUrl } from '../../lib/collections/sequences/helpers';
import { defineStyles } from "@/components/hooks/defineStyles";
import { EmailContextType, emailUseStyles } from "./emailContext";

const styles = defineStyles("SequenceNewPostsEmail", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
    marginBottom: 40
  },
  img: {
    display: 'block',
    maxHeight: 250,
    margin: '0 auto 25px',
  },
}));

export const SequenceNewPostsEmail = ({sequence, posts, emailContext}: {
  sequence: DbSequence,
  posts: DbPost[],
  emailContext: EmailContextType,
}) => {
  const classes = emailUseStyles(styles, emailContext);
  const img = sequence.gridImageId || sequence.bannerImageId;
    const imgUrl = img ? makeCloudinaryImageUrl(img, {
      c: "fill",
      dpr: "auto",
      q: "auto",
      f: "auto",
      g: "auto:faces",
    }, emailContext.resolverContext.forumType) : undefined;
  
  return <div className={classes.root}>
    {imgUrl && <img src={imgUrl} className={classes.img} />}
    <p>
      The following posts have been added to <a href={sequenceGetAbsolutePageUrl(sequence, emailContext.resolverContext.forumType)}>{sequence.title}</a>:
    </p>
    <ul>
      {posts.map(post => {
        return <li key={post._id}>
          <a href={postGetAbsolutePageUrl(post, emailContext.resolverContext.forumType)}>{post.title}</a>
        </li>
      })}
    </ul>
  </div>
}

