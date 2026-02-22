import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import { useState } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userCanEditTagPortal } from '../../lib/betas';
import { getTagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ContentStyles from "../common/ContentStyles";
import SectionButton from "../common/SectionButton";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { ContentItemBody } from "../contents/ContentItemBody";
import LoginPopup from "../users/LoginPopup";
import Loading from "../vulcan-core/Loading";
import AllTagsAlphabetical from "./AllTagsAlphabetical";
import CoreTagsSection from "./CoreTagsSection";
import { EditTagForm } from './EditTagPage';
import { useTagBySlug } from './useTag';

const TagEditFragmentQuery = gql(`
  query EAAllTagsPage($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagEditFragment
      }
    }
  }
`);

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
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "AllTagsPageFragment");
  const [ editing, setEditing ] = useState(false)

  const { data } = useQuery(TagEditFragmentQuery, {
    variables: { documentId: tag?._id },
    skip: !tag || !editing,
    ssr: false,
  });
  const editableTag = data?.tag?.result;
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
                to={getTagCreateUrl()}
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

export default registerComponent("EAAllTagsPage", EAAllTagsPage, {styles});


