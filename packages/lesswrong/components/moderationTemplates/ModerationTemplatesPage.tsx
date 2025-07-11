import React, { useState } from 'react';
import { userCanDo } from "../../lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { ALLOWABLE_COLLECTIONS, TemplateType } from "@/lib/collections/moderationTemplates/constants";
import classNames from 'classnames';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { ModerationTemplatesForm } from './ModerationTemplateForm';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import ModerationTemplateItem from "./ModerationTemplateItem";
import BasicFormStyles from "../form-components/BasicFormStyles";
import Loading from "../vulcan-core/Loading";
import Row from "../common/Row";
import ToCColumn from "../posts/TableOfContents/ToCColumn";
import TableOfContents from "../posts/TableOfContents/TableOfContents";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const ModerationTemplateFragmentMultiQuery = gql(`
  query multiModerationTemplateModerationTemplatesPageQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

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
  const currentUser = useCurrentUser();
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [filter, setFilter] = useState<TemplateType|null>(null);
  
  const { data, loading } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesPage: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const moderationTemplates = data?.moderationTemplates?.results ?? [];
  
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
          <ModerationTemplatesForm />
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
  

export default registerComponent('ModerationTemplatesPage', ModerationTemplatesPage, {styles});



