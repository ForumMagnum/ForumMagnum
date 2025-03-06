import React from 'react';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { useTagBySlug } from './useTag';
import { useApolloClient } from "@apollo/client";
import { isLWorAF, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { ContentStyles } from "@/components/common/ContentStyles";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import Error404 from "@/components/common/Error404";
import { Loading } from "@/components/vulcan-core/Loading";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";

export const EditTagForm = ({tag, successCallback, cancelCallback, changeCallback, warnUnsavedChanges}: {
  tag: TagFragment,
  successCallback?: any,
  cancelCallback?: any,
  changeCallback?: any,
  warnUnsavedChanges?: boolean,
}) => {
  return <ContentStyles contentType="tag">
    <WrappedSmartForm
      key={`${tag?._id}_${tag?.description?.version}`}
      collectionName="Tags"
      documentId={tag._id}
      queryFragment={getFragment('TagEditFragment')}
      mutationFragment={getFragment('TagWithFlagsFragment')}
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
    return <Loading/>
  if (!tag)
    return <Error404/>
  
  return (
    <SingleColumnSection>
      <SectionTitle title={`Edit ${taggingNameCapitalSetting.get()} #${tag.name}`}/>
      <EditTagForm 
        tag={tag} 
        successCallback={ async (tag: any) => {
          await client.resetStore()
          navigate({pathname: tagGetUrl(tag)})
        }}
      />
    </SingleColumnSection>
  );
}

const EditTagPageComponent = registerComponent('EditTagPage', EditTagPage);

declare global {
  interface ComponentTypes {
    EditTagPage: typeof EditTagPageComponent
  }
}

export default EditTagPageComponent;
