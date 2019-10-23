import React from 'react';
import { registerComponent, Components, getFragment } from 'meteor/vulcan:core';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import { Tags } from '../../lib/collections/tags/collection.js';
import { useTag } from './useTag.jsx';

const EditTagPage = () => {
  const { params } = useLocation();
  const { history } = useNavigation();
  const { tag: tagName } = params;
  const { tag, loading } = useTag(tagName);
  
  if (loading)
    return <Components.Loading/>
  if (!tag)
    return <Components.Error404/>
  
  return (
    <Components.SingleColumnSection>
      <Components.SectionTitle title={`Edit Tag #${tagName}`}/>
      <Components.WrappedSmartForm
        collection={Tags}
        documentId={tag._id}
        queryFragment={getFragment('TagEditFragment')}
        mutationFragment={getFragment('TagEditFragment')}
        successCallback={tag => {
          history.push(`/tag/${tagName}`); //TODO: Util function for tag URL
        }}
      />
    </Components.SingleColumnSection>
  );
}

registerComponent('EditTagPage', EditTagPage);

