import React from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { ModerationTemplates } from "../../lib/collections/moderationTemplates";
import { userCanDo } from "../../lib/vulcan-users";
import { useCurrentUser } from "../common/withUser";
import {useMulti} from "../../lib/crud/withMulti";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    
  }
});

//a page for creating and viewing moderation templates
export const ModerationTemplatesPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { WrappedSmartForm, SingleColumnSection, SectionTitle, ModerationTemplateItem } = Components
  
  const currentUser = useCurrentUser();
  
  const { results: moderationTemplates = [], loading } = useMulti({
    collectionName: 'ModerationTemplates',
    fragmentName: 'ModerationTemplateFragment',
    terms: {
      view: "moderationTemplatesPage",
      limit: 100
    }
  });
  
  if (!userCanDo(currentUser, 'moderationTemplates.edit.all')) return null
  
  return <SingleColumnSection>
    <SectionTitle title={'New Moderation Template'} />
    <div className={classes.form}>
      <WrappedSmartForm
        collection={ModerationTemplates}
        mutationFragment={getFragment('ModerationTemplateFragment')}
      />
    </div>
    {/*{loading && <Loading/>}*/}
    <SectionTitle title="Moderation Templates"/>
    {moderationTemplates.map(template => <ModerationTemplateItem key={template._id} template={template}/>)}
  </SingleColumnSection>
}
  

const ModerationTemplatesPageComponent = registerComponent('ModerationTemplatesPage', ModerationTemplatesPage, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplatesPage: typeof ModerationTemplatesPageComponent
  }
}

