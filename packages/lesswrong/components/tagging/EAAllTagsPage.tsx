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
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  portalSection: {
    marginBottom: theme.spacing.unit*8,
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
    borderRadius: theme.borderRadius.default,
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


const EAAllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "AllTagsPageFragment");
  const [ editing, setEditing ] = useState(false)

  const { AllTagsAlphabetical, SectionButton, SectionTitle, ContentItemBody, ContentStyles, Loading, CoreTagsSection, SingleColumnSection } = Components;

  const portalTitle = `EA Forum ${`${taggingNamePluralCapitalSetting.get()} `}Wiki`
  
  const htmlWithAnchors = tag?.tableOfContents?.html || tag?.description?.html || "";

  return (
    <AnalyticsContext pageContext="allTagsPage">
      <SingleColumnSection>
        <SectionTitle title={`Core ${taggingNamePluralSetting.get()}`} noTopMargin />
        <CoreTagsSection />
        <div className={classes.portalSection}>
          <SectionTitle title={portalTitle}>
            <SectionButton>
              {currentUser && tagUserHasSufficientKarma(currentUser, "new") && <Link
                to={tagCreateUrl}
              >
                <AddBoxIcon className={classes.addTagButton}/>
                New {taggingNameCapitalSetting.get()}
              </Link>}
              {!currentUser && <a onClick={(ev) => {
                openDialog({
                  componentName: "LoginPopup",
                  componentProps: {}
                });
                ev.preventDefault();
              }}>
                <AddBoxIcon className={classes.addTagButton}/>
                New {taggingNameCapitalSetting.get()}
              </a>}
            </SectionButton>
          </SectionTitle>
          <ContentStyles contentType="comment" className={classes.portal}>
            {!tag && <Loading/>}
            {userCanEditTagPortal(currentUser) && <a onClick={() => setEditing(true)} className={classes.edit}>
              Edit
            </a>}
            {editing && tag ?
              <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
              :
              <ContentItemBody
                dangerouslySetInnerHTML={{__html: htmlWithAnchors}}
                description={`tag ${tag?.name}`} noHoverPreviewPrefetch
              />
            }
          </ContentStyles>
          <AnalyticsContext pageSectionContext="allTagsAlphabetical">
            <AllTagsAlphabetical />
          </AnalyticsContext>
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

const EAAllTagsPageComponent = registerComponent("EAAllTagsPage", EAAllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    EAAllTagsPage: typeof EAAllTagsPageComponent
  }
}
