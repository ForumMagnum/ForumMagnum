import React from 'react';
import { registerComponent, Components, getFragment } from 'meteor/vulcan:core';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import { Tags } from '../../lib/collections/tags/collection.js';
import { useTagBySlug } from './useTag.jsx';

const EditTagPage = () => {
  const { params } = useLocation();
  const { history } = useNavigation();
  const { slug } = params;
  const { tag, loading } = useTagBySlug(slug);
  
  if (loading)
    return <Components.Loading/>
  if (!tag)
    return <Components.Error404/>
  
  return (
    <Components.SingleColumnSection>
      <Components.SectionTitle title={`Edit Tag #${tag.name}`}/>
      <Components.WrappedSmartForm
        collection={Tags}
        documentId={tag._id}
        queryFragment={getFragment('TagEditFragment')}
        mutationFragment={getFragment('TagEditFragment')}
        successCallback={tag => {
          history.push({pathname: `/tag/${tag.slug}`}); //TODO: Util function for tag URL
        }}
      />
    </Components.SingleColumnSection>
  );
}

registerComponent('EditTagPage', EditTagPage);

