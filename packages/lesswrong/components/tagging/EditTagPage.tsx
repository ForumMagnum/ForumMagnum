import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import { Tags } from '../../lib/collections/tags/collection';
import { useTagBySlug } from './useTag';

export const EditTagForm = ({tag, successCallback}: {
    tag: TagFragment|TagPreviewFragment,
    successCallback?: any
  }) => {
  return <Components.WrappedSmartForm
    collection={Tags}
    documentId={tag._id}
    queryFragment={getFragment('TagEditFragment')}
    mutationFragment={getFragment('TagEditFragment')}
    successCallback={successCallback}
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
        successCallback={tag => history.push({pathname: Tags.getUrl(tag)})}
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
