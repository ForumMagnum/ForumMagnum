import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import { Tags } from '../../lib/collections/tags/collection';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { useTagBySlug } from './useTag';

export const EditTagForm = ({tag, successCallback, cancelCallback}: {
  tag: TagFragment,
  successCallback?: any,
  cancelCallback?: any
}) => {
  return <Components.WrappedSmartForm
    key={`${tag?._id}_${tag?.description?.version}`}
    collection={Tags}
    documentId={tag._id}
    queryFragment={getFragment('TagEditFragment')}
    mutationFragment={getFragment('TagWithFlagsFragment')}
    successCallback={successCallback}
    cancelCallback={cancelCallback}
  />
}

const EditTagPage = () => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading } = useTagBySlug(slug, "TagFragment");
  const { history } = useNavigation();

  if (loading)
    return <Components.Loading/>
  if (!tag)
    return <Components.Error404/>
  
  return (
    <Components.SingleColumnSection>
      <Components.SectionTitle title={`Edit Tag #${tag.name}`}/>
      <EditTagForm 
        tag={tag} 
        successCallback={tag => history.push({pathname: tagGetUrl(tag)})}
      />
    </Components.SingleColumnSection>
  );
}

const EditTagPageComponent = registerComponent('EditTagPage', EditTagPage);

declare global {
  interface ComponentTypes {
    EditTagPage: typeof EditTagPageComponent
  }
}
