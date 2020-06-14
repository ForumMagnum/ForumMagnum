import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = theme => ({
});

const TagPostItem = ({classes, post}: {
  classes: ClassesType,
  post: PostsList
}) => {
  const [highlightVisible, setHighlightVisible] = useState(false); 
  const { PostsTitle, PostsHighlight, ContentItemBody } = Components

  return <div>
    <PostsTitle post={post} />
    { highlightVisible ?
          <div className={highlightClasses}>
            <PostsHighlight post={post} />
          </div>
          : <div className={highlightClasses} onClick={showHighlight}>
              { showSnippet &&
                <ContentItemBody
                  className={classes.postHighlight}
                  dangerouslySetInnerHTML={{__html: postExcerptFromHTML(post.contents && post.contents.htmlHighlight)}}
                  description={`post ${post._id}`}
                />
              }
            </div>
        }
  </div>
}

const TagPostItemComponent = registerComponent("TagPostItem", TagPostItem, {styles});

declare global {
  interface ComponentTypes {
    TagPostItem: typeof TagPostItemComponent
  }
}
