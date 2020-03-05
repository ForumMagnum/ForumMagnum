import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useNavigation } from '../../lib/routeUtil'
import { useCurrentUser } from '../common/withUser';
import { Tags } from '../../lib/collections/tags/collection';

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
          history.push({pathname: `/tag/${tag.slug}`}); //TODO: Util function for tag URL
        }}
      />
    </SingleColumnSection>
  );
}

const NewTagPageComponent = registerComponent('NewTagPage', NewTagPage);

declare global {
  interface ComponentTypes {
    NewTagPage: typeof NewTagPageComponent
  }
}
