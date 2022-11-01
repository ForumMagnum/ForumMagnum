import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { ModerationTemplates } from "../../lib/collections/moderationTemplates";
import { userCanDo } from "../../lib/vulcan-users";
import { useCurrentUser } from "../common/withUser";
import {useMulti} from "../../lib/crud/withMulti";

const styles = (theme: ThemeType): JssStyles => ({
  form: {
    border: theme.palette.border.commentBorder,
    padding: 12,
    paddingLeft: 16,
    background: theme.palette.panelBackground.default,
  }
});

//a page for creating and viewing moderation templates
export const ModerationTemplatesPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { WrappedSmartForm, SingleColumnSection, SectionTitle, ModerationTemplateItem, BasicFormStyles, Loading } = Components
  
  const currentUser = useCurrentUser();
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  
  const { results: moderationTemplates = [], loading } = useMulti({
    collectionName: 'ModerationTemplates',
    fragmentName: 'ModerationTemplateFragment',
    terms: {
      view: "moderationTemplatesPage",
      limit: 100
    }
  });
  
  if (!userCanDo(currentUser, 'moderationTemplates.edit.all')) return null
  
  const nonDeletedTemplates = moderationTemplates.filter(template => !template.deleted)
  const deletedTemplates = moderationTemplates.filter(template => template.deleted)

  return <SingleColumnSection>
    <SectionTitle title={'New Moderation Template'} />
    <div className={classes.form}>
      <BasicFormStyles>
        <WrappedSmartForm
          collection={ModerationTemplates}
          mutationFragment={getFragment('ModerationTemplateFragment')}
        />
      </BasicFormStyles>
    </div>
    <SectionTitle title="Moderation Templates"/>
    {loading && <Loading/>}
    {nonDeletedTemplates.map(template => <ModerationTemplateItem key={template._id} template={template}/>)}
    
    <button onClick={() => setShowDeleted(!showDeleted)}>Show Deleted</button>
    
    {showDeleted && deletedTemplates.map(template => <ModerationTemplateItem key={template._id} template={template}/>)}
  </SingleColumnSection>
}
  

const ModerationTemplatesPageComponent = registerComponent('ModerationTemplatesPage', ModerationTemplatesPage, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplatesPage: typeof ModerationTemplatesPageComponent
  }
}

