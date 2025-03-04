import React from 'react';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { useTagBySlug } from './useTag';
import { useApolloClient } from "@apollo/client";
import { isLWorAF, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";

export const EditTagForm = ({tag, successCallback, cancelCallback, changeCallback, warnUnsavedChanges}: {
  tag: TagFragment,
  successCallback?: any,
  cancelCallback?: any,
  changeCallback?: any,
  warnUnsavedChanges?: boolean,
}) => {
  const { ContentStyles } = Components;
  return <ContentStyles contentType="tag">
    <Components.WrappedSmartForm
      key={`${tag?._id}_${tag?.description?.version}`}
      collectionName="Tags"
      documentId={tag._id}
      queryFragmentName={'TagEditFragment'}
      mutationFragmentName={'TagWithFlagsFragment'}
      successCallback={successCallback}
      cancelCallback={cancelCallback}
      addFields={isLWorAF ? ['summaries'] : []}
      warnUnsavedChanges={warnUnsavedChanges}
      changeCallback={changeCallback}
    />
  </ContentStyles>
}

const EditTagPage = () => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading } = useTagBySlug(slug, "TagFragment");
  const navigate = useNavigate();
  const client = useApolloClient()

  if (loading)
    return <Components.Loading/>
  if (!tag)
    return <Components.Error404/>
  
  return (
    <Components.SingleColumnSection>
      <Components.SectionTitle title={`Edit ${taggingNameCapitalSetting.get()} #${tag.name}`}/>
      <EditTagForm 
        tag={tag} 
        successCallback={ async (tag: any) => {
          await client.resetStore()
          navigate({pathname: tagGetUrl(tag)})
        }}
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
