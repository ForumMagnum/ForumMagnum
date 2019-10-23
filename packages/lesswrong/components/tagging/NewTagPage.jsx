import React from 'react';
import { registerComponent, Components, getFragment } from 'meteor/vulcan:core';
import { useNavigation } from '../../lib/routeUtil'
import { useCurrentUser } from '../common/withUser.js';
import { Tags } from '../../lib/collections/tags/collection.js';

const NewTagPage = () => {
  const { history } = useNavigation();
  const currentUser = useCurrentUser();
  const { SingleColumnSection, SectionTitle, WrappedSmartForm } = Components;
  
  if (!currentUser || !currentUser.isAdmin) {
    return (
      <SingleColumnSection>
        <SectionTitle title="New Tag"/>
        <div>
          You must be logged in as an admin to define new tags.
        </div>
      </SingleColumnSection>
    );
  }
  
  return (
    <SingleColumnSection>
      <SectionTitle title="New Tag"/>
      <WrappedSmartForm
        collection={Tags}
        mutationFragment={getFragment('TagFragment')}
        successCallback={tag => {
          history.push(`/tag/${tag.name}`); //TODO: Util function for tag URL
        }}
      />
    </SingleColumnSection>
  );
}

registerComponent('NewTagPage', NewTagPage);
