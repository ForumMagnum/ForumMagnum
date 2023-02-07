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
import { taggingNameCapitalSetting, taggingNameIsSet, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { forumSelect } from '../../lib/forumTypeUtils';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
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
  coreTagsSection: {
    /**
     * I'm slightly abusing the ToCColumn component by using an empty table of contents for the top core tags section.
     * This makes it way easier to line up with the rest of the page, while keeping the table of contents for the
     * lower wiki section. This works fine apart from the fact that the table of contents component has a fixed height of 80vh,
     * this removes that
     */
    '& .ToCColumn-stickyBlockScroller': {
      height: "unset !important"
    },
  }
})


const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "AllTagsPageFragment");
  const [ editing, setEditing ] = useState(false)

  const { AllTagsAlphabetical, SectionButton, SectionTitle, ContentItemBody, ContentStyles, ToCColumn, TagTableOfContents, Loading, CoreTagsSection } = Components;

  let portalTitle = forumSelect({
    EAForum: 'EA Forum Wiki',
    default: 'Concepts Portal'
  })
  if (taggingNameIsSet.get()) {
    portalTitle = forumSelect({
      EAForum: `EA Forum ${taggingNamePluralCapitalSetting.get()} Wiki`,
      default: `${taggingNamePluralCapitalSetting.get()} Portal`
    })
  }
  
  const htmlWithAnchors = tag?.tableOfContents?.html || tag?.description?.html || "";

  return (
    <AnalyticsContext pageContext="allTagsPage">
      <div className={classes.root}>
        <div className={classes.coreTagsSection}>
          <ToCColumn
            tableOfContents={<div/>}
            header={<SectionTitle title={`Core ${taggingNamePluralSetting.get()}`} noTopMargin />}
            centerEarly
          >
            <AnalyticsContext pageSectionContext="coreTagsSection">
              <CoreTagsSection />
            </AnalyticsContext>
          </ToCColumn>
        </div>
        <div className={classes.portalSection}>
          <AnalyticsContext pageSectionContext="tagPortal">
            <ToCColumn
              tableOfContents={tag ? <TagTableOfContents
                tag={tag} showContributors={false}
                displayOptions={{
                  addedRows: [
                    {
                      title: `All ${taggingNamePluralCapitalSetting.get()}`,
                      anchor: `all-${taggingNamePluralSetting.get()}`,
                      level: 0,
                    },
                  ],
                  ...forumSelect({
                    // Changes to ToC presentation that're specific to the content on LW's version of the Concepts page
                    LessWrong: {
                      downcaseAllCapsHeadings: true,
                      maxHeadingDepth: 1,
                    },
                    default: undefined,
                  })
                }}
              /> : <div/>}
              header={<SectionTitle title={portalTitle}>
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
              </SectionTitle>}
              centerEarly
            >
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
            </ToCColumn>
          </AnalyticsContext>
        </div>
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
