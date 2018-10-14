import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';

const CollectionsNavigation = ({
  nextPostUrl,
  prevPostUrl,
  title,
  titleUrl,
  loading
}) => {

  return (
    <div className="sequences-navigation-top">
      {loading ? <Components.Loading/> : <>
        <Components.SequencesNavigationLink
          disabled={!prevPostUrl}
          documentUrl={prevPostUrl}
          direction="left"
        />
  
        <div className="sequences-navigation-title">
          {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
        </div>
  
        <Components.SequencesNavigationLink
          disabled={!nextPostUrl}
          documentUrl={nextPostUrl}
          direction="right"
        />
      </>}
    </div>
  )
}

registerComponent('CollectionsNavigation', CollectionsNavigation);
