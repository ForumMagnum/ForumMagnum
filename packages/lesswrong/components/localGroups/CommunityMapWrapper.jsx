import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withErrorBoundary from '../common/withErrorBoundary';

const CommunityMapWrapper = ({classes, groupQueryTerms, results, currentUserLocation, mapOptions, terms, showHideMap, petrovButton}) => {
  return (
    <Components.CommunityMap
      groupTerms={groupQueryTerms}
      eventTerms={terms}
      center={currentUserLocation}
      showHideMap={showHideMap}
      petrovButton={petrovButton}
      {...mapOptions}
    />
  )
}

registerComponent("CommunityMapWrapper", CommunityMapWrapper, withErrorBoundary,)
