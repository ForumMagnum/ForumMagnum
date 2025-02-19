import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from "../../lib/vulcan-users";
import { useCurrentUser } from "../common/withUser";
import {useMulti} from "../../lib/crud/withMulti";
import { ALLOWABLE_COLLECTIONS, TemplateType } from '../../lib/collections/moderationTemplates/schema';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  form: {
    border: theme.palette.border.commentBorder,
    padding: 12,
    paddingLeft: 16,
    background: theme.palette.panelBackground.default,
  },
  filter: {
    ...theme.typography.body2,
    padding: 8,
    border: theme.palette.border.commentBorder,
    borderRadius: 2,
    cursor: "pointer",
    marginRight: 8,
    background: theme.palette.panelBackground
  },
  filterSelected: {
    backgroundColor: theme.palette.grey[200]
  }
});

//a page for creating and viewing moderation templates
export const ModerationTemplatesPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { WrappedSmartForm, SingleColumnSection, SectionTitle, ModerationTemplateItem, BasicFormStyles, Loading, Row, ToCColumn, TableOfContents } = Components
  
  const currentUser = useCurrentUser();
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [filter, setFilter] = useState<TemplateType|null>(null);
  
  const { results: moderationTemplates = [], loading } = useMulti({
    collectionName: 'ModerationTemplates',
    fragmentName: 'ModerationTemplateFragment',
    terms: {
      view: "moderationTemplatesPage",
      limit: 100
    }
  });
  
  if (!userCanDo(currentUser, 'moderationTemplates.edit.all')) return null
  
  const filteredTemplates = moderationTemplates.filter(template => {
    return template.collectionName === filter || !filter
  })
  const nonDeletedTemplates = filteredTemplates.filter(template => !template.deleted)
  const deletedTemplates = filteredTemplates.filter(template => template.deleted)

  const handleFilter = (type: TemplateType) => {
    if (filter === type) {
      setFilter(null)
    } else {
      setFilter(type)
    }
  }

  const sectionData = {
    html: "",
    sections: [
      ...nonDeletedTemplates.map(template => 
        ({
        title: template.name,
        anchor: template._id,
        level: 1
      }))
    ],
  }

  return <ToCColumn tableOfContents={<TableOfContents
    sectionData={sectionData}
    title={"Moderation Templates"}
  />}>
    <SingleColumnSection>
      <SectionTitle title={'New Moderation Template'} />
      <div className={classes.form}>
        <BasicFormStyles>
          <WrappedSmartForm
            collectionName="ModerationTemplates"
            mutationFragment={getFragment('ModerationTemplateFragment')}
          />
        </BasicFormStyles>
      </div>
      <SectionTitle title="Moderation Templates">
        <Row justifyContent='flex-start'>
          {ALLOWABLE_COLLECTIONS.map(type => 
          <div 
            key={type} 
            onClick={() => handleFilter(type)} 
            className={classNames(classes.filter, {[classes.filterSelected]: type === filter})}
          >
            {type}
          </div>)}
        </Row>
      </SectionTitle>
      {loading && <Loading/>}
      {nonDeletedTemplates.map(template => <div id={template._id} key={template._id} >
          <ModerationTemplateItem template={template}/>
        </div>
      )}
      
      <a role="button" onClick={() => setShowDeleted(!showDeleted)}>Show Deleted</a>
      
      {showDeleted && deletedTemplates.map(template => {
        if (template.collectionName === filter || !filter) {
          return <ModerationTemplateItem key={template._id} template={template}/>
        }
      })}
    </SingleColumnSection>
  </ToCColumn>
}
  

const ModerationTemplatesPageComponent = registerComponent('ModerationTemplatesPage', ModerationTemplatesPage, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplatesPage: typeof ModerationTemplatesPageComponent
  }
}

