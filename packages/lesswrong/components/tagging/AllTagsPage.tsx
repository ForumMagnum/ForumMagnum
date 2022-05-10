import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTagBySlug } from './useTag';
import { EditTagForm } from './EditTagPage';
import { userCanEditTagPortal } from '../../lib/betas'
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useDialog } from '../common/withDialog';
import { forumTypeSetting, taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { forumSelect } from '../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  topSection: {
    maxWidth: 800,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.unit*8
  },
  alphabetical: {
    columns: 5,
    columnWidth: 200,
    columnGap: 0,
    background: theme.palette.panelBackground.default,
    padding: 20,
    marginBottom: 24
  },
  portal: {
    marginBottom: 18,
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      '& td': {
        display: 'block',
        width: '100% !important',
        height: 'inherit !important'
      }
    }
  },
  edit: {
    float: "right",
    marginRight: 5,
    color: theme.palette.grey[600],
  },
  addTagButton: {
    verticalAlign: "middle",
  },
})


const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "TagFragment");
  const [ editing, setEditing ] = useState(false)

  const { AllTagsAlphabetical, SectionButton, SectionTitle, ContentItemBody, ContentStyles } = Components;

  let sectionTitle = forumSelect({
    EAForum: 'EA Forum Wiki',
    default: 'Concepts Portal'
  })
  if (taggingNameIsSet.get()) {
    sectionTitle = forumSelect({
      EAForum: `EA Forum ${taggingNamePluralCapitalSetting.get()} Wiki`,
      default: `${taggingNamePluralCapitalSetting.get()} Portal`
    })
  }

  return (
    <AnalyticsContext pageContext="allTagsPage">
      <div className={classes.root}>
        <div className={classes.topSection}>
          <AnalyticsContext pageSectionContext="tagPortal">
            <SectionTitle title={sectionTitle}>
              <SectionButton>
                {currentUser
                  ? <Link to={`/${taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'}/create`}>
                      <AddBoxIcon className={classes.addTagButton}/>
                      New {taggingNameCapitalSetting.get()}
                    </Link>
                  : <a onClick={(ev) => {
                      openDialog({
                        componentName: "LoginPopup",
                        componentProps: {}
                      });
                      ev.preventDefault();
                    }}>
                      <AddBoxIcon className={classes.addTagButton}/>
                      New {taggingNameCapitalSetting.get()}
                    </a>
                }
              </SectionButton>
            </SectionTitle>
            <ContentStyles contentType="comment" className={classes.portal}>
              {userCanEditTagPortal(currentUser) && <a onClick={() => setEditing(true)} className={classes.edit}>
                Edit
              </a>}
              {editing && tag ?
                <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
                :
                <ContentItemBody
                  dangerouslySetInnerHTML={{__html: tag?.description?.html || ""}}
                  description={`tag ${tag?.name}`} noHoverPreviewPrefetch
                />
              }
            </ContentStyles>
          </AnalyticsContext>
        </div>
        <AnalyticsContext pageSectionContext="allTagsAlphabetical">
          <AllTagsAlphabetical />
        </AnalyticsContext>
      </div>
    </AnalyticsContext>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
