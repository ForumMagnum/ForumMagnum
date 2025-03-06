import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { CommunityMap } from "@/components/localGroups/CommunityMap";

const CommunityMapWrapper = ({className, groupQueryTerms, currentUserLocation, mapOptions, terms, keywordSearch, showHideMap, hideLegend, showUsersByDefault, showGroupsByDefault=true, petrovButton}: {
  className?: string,
  groupQueryTerms?: LocalgroupsViewTerms,
  currentUserLocation?: any,
  hideLegend?: boolean,
  mapOptions?: any,
  terms?: PostsViewTerms,
  keywordSearch?: string,
  showHideMap?: boolean,
  showUsersByDefault?: boolean,
  showGroupsByDefault?: boolean,
  petrovButton?: any,
}) => {
  return (
    <CommunityMap
      className={className}
      groupTerms={groupQueryTerms}
      eventTerms={terms}
      keywordSearch={keywordSearch}
      center={currentUserLocation}
      showHideMap={showHideMap}
      petrovButton={petrovButton}
      hideLegend={hideLegend}
      showUsersByDefault={showUsersByDefault}
      showGroupsByDefault={showGroupsByDefault}
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

export default CommunityMapWrapperComponent;

