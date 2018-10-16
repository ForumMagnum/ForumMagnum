import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';

const CollectionsNavigation = ({
  nextPostUrl,
  prevPostUrl,
  title,
  titleUrl,
  loading,
  
  // Two different ways of identifying the prev/next post for SequencesNavigation,
  // depending on whether this is a collection or a sequence.
  nextPostId, prevPostId,
  nextPostSlug, prevPostSlug,
}) => {

  return (
    <div className="sequences-navigation-top">
      {loading ? <Components.Loading/> : <React.Fragment>
        <Components.SequencesNavigationLink
          disabled={!prevPostUrl}
          documentUrl={prevPostUrl}
          direction="left"
          
          documentId={prevPostId}
          slug={prevPostSlug}
        />
  
        <div className="sequences-navigation-title">
          {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
        </div>
  
        <Components.SequencesNavigationLink
          disabled={!nextPostUrl}
          documentUrl={nextPostUrl}
          direction="right"
          
          documentId={nextPostId}
          slug={nextPostSlug}
        />
      </React.Fragment>}
    </div>
  )
}

registerComponent('CollectionsNavigation', CollectionsNavigation);
