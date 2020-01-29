import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withErrorBoundary from '../common/withErrorBoundary';

const CommunityMapWrapper = ({classes, groupQueryTerms, currentUserLocation, mapOptions, terms, showHideMap, petrovButton}: {
  classes: any,
  groupQueryTerms?: any,
  currentUserLocation?: any,
  mapOptions?: any,
  terms: any,
  showHideMap?: any,
  petrovButton?: any,
}) => {
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

const CommunityMapWrapperComponent = registerComponent("CommunityMapWrapper", CommunityMapWrapper, {
  hocs: [withErrorBoundary]
})

declare global {
  interface ComponentTypes {
    CommunityMapWrapper: typeof CommunityMapWrapperComponent
  }
}

