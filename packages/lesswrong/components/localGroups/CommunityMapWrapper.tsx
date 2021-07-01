import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { forumTypeSetting } from '../../lib/instanceSettings';

const CommunityMapWrapper = ({classes, groupQueryTerms, currentUserLocation, mapOptions, terms, showHideMap, petrovButton}: {
  classes: ClassesType,
  groupQueryTerms?: LocalgroupsViewTerms,
  currentUserLocation?: any,
  mapOptions?: any,
  terms: PostsViewTerms,
  showHideMap?: boolean,
  petrovButton?: any,
}) => {
  const { CommunityMap, EACommunityMap } = Components;
  const MapComponent = forumTypeSetting.get() === 'EAForum' ?
    EACommunityMap :
    CommunityMap;
  return (
    <MapComponent
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

