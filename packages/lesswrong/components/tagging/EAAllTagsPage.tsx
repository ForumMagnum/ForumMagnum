import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTagBySlug } from './useTag';
import { EditTagForm } from './EditTagPage';
import { userCanEditTagPortal } from '../../lib/betas'
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import { useDialog } from '../common/withDialog';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useSingle } from '@/lib/crud/withSingle';
import { isFriendlyUI } from '@/themes/forumTheme';
import { LoginPopup } from "../users/LoginPopup";
import { AllTagsAlphabetical } from "./AllTagsAlphabetical";
import { SectionButton } from "../common/SectionButton";
import { SectionTitle } from "../common/SectionTitle";
import { ContentItemBody } from "../common/ContentItemBody";
import { ContentStyles } from "../common/ContentStyles";
import { Loading } from "../vulcan-core/Loading";
import { CoreTagsSection } from "./CoreTagsSection";
import { SingleColumnSection } from "../common/SingleColumnSection";

const styles = (theme: ThemeType) => ({
  coreTagsTitle: {
    [theme.breakpoints.down('sm')]: {
      marginTop: 20
    }
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
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down('xs')]: {
      '& td': {
        display: 'block',
        width: '100% !important',
        height: 'inherit !important'
      }
    },
    ...(isFriendlyUI && {
      background: theme.palette.grey[0],
      marginTop: 'unset',
      marginBottom: 'unset',
      padding: '20px',
      boxShadow: `0 1px 5px ${theme.palette.greyAlpha(.025)}`,
    }),
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


const EAAllTagsPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "AllTagsPageFragment");
  const [ editing, setEditing ] = useState(false)

  const { document: editableTag } = useSingle({
    documentId: tag?._id,
    collectionName: 'Tags',
    fragmentName: 'TagEditFragment',
    skip: !tag || !editing,
    ssr: false,
  });
  const portalTitle = `EA Forum ${`${taggingNamePluralCapitalSetting.get()} `}Wiki`
  
  const htmlWithAnchors = tag?.tableOfContents?.html || tag?.description?.html || "";

  return (
    <AnalyticsContext pageContext="allTagsPage">
      <SingleColumnSection>
        <SectionTitle title={`Core ${taggingNamePluralSetting.get()}`} noTopMargin titleClassName={classes.coreTagsTitle} />
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
                  name: "LoginPopup",
                  contents: ({onClose}) => <LoginPopup onClose={onClose} />
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
            {editableTag ?
              <EditTagForm tag={editableTag} successCallback={()=>setEditing(false)}/>
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

export const EAAllTagsPage = registerComponent("EAAllTagsPage", EAAllTagsPageInner, {styles});

declare global {
  interface ComponentTypes {
    EAAllTagsPage: typeof EAAllTagsPage
  }
}
