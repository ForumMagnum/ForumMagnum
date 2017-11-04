import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import IconButton from 'material-ui/IconButton'
import React from 'react';

const CollectionsNavigation = ({
    nextPostSlug,
    prevPostSlug,
    nextPostUrl,
    prevPostUrl,
    title
  }) => {

    return (
      <div className="sequences-navigation-top">
        <Components.SequencesNavigationLink
                          slug={prevPostSlug}
                          documentUrl={prevPostUrl}
                          direction="left" />

                        <div className="sequences-navigation-title">
                          {title ? title : <Components.Loading/>}
                        </div>

        <Components.SequencesNavigationLink
                          slug={nextPostSlug}
                          documentUrl={nextPostUrl}
                          direction="right" />
      </div>
    )
  }

registerComponent('CollectionsNavigation', CollectionsNavigation);
