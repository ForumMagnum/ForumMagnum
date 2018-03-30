import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';

const RecommendedReading = ({sequence, chapter, post, previousPost, nextPost, nextTitle, nextLink, collectionTitle}) => {
  return <div className="sequences-navigation-bottom-content">
    {(previousPost && sequence) ? <div className="sequences-navigation-bottom-previous-post">
      <Components.RecommendedReadingItem direction="Previous" post={previousPost} sequence={sequence}/>
    </div> : null}
    <div className="sequences-navigation-bottom-divider"></div>
    { nextTitle ?
      <div className="sequences-navigation-bottom-next-sequence next-only">
        <Link className="sequences-navigation-next-sequence" to={nextLink || post.nextPageLink}>
          <div className="sequences-navigation-next-sequence-direction">Next Sequence:</div> {nextTitle || post.nextPageTitle}
        </Link>
      </div>
    : (
      (nextPost && sequence) ? <div className="sequences-navigation-bottom-next-post">
        <Components.RecommendedReadingItem direction="Next" post={nextPost} sequence={sequence}/>
      </div> : null
    ) }
  </div>
};


registerComponent('RecommendedReading', RecommendedReading,  withRouter);
