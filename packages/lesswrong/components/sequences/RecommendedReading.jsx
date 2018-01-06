import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';

const RecommendedReading = ({sequence, chapter, post, previousPost, nextPost, nextTitle, nextLink, collectionTitle}) => {
  return <div className="sequences-navigation-bottom-content">
      {previousPost ? <div className="sequences-navigation-bottom-previous-post">
        <Components.PostsItem post={previousPost} inlineCommentCount={true} chapter={chapter}/>
      </div> : null}
      <div className="sequences-navigation-bottom-divider"></div>
      {nextTitle ? <div className="sequences-navigation-bottom-next-post next-only"><Link className="sequences-navigation-next-post" to={nextLink || post.nextPageLink}>Next: {nextTitle || post.nextPageTitle}</Link></div> : (nextPost ? <div className="sequences-navigation-bottom-next-post">
        <Components.PostsItem post={nextPost} inlineCommentCount={true} chapter={chapter} />
      </div> : null) }
    </div>
};


registerComponent('RecommendedReading', RecommendedReading,  withRouter);
