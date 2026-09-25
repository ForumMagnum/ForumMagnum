import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import qs from 'qs';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { sectionFooterLeftStyles } from '../users/UsersProfile'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { defaultSequenceBannerIdSetting, nofollowKarmaThreshold } from '@/lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';
import { allowSubscribeToSequencePosts } from '../../lib/betas';
import { Link } from '../../lib/reactRouterWrapper';
import { useNavigate, useSubscribedLocation } from '../../lib/routeUtil';
import DeferRender from '../common/DeferRender';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import CloudinaryImage from "../common/CloudinaryImage";
import { SequenceEditorProvider } from "../sequenceEditor/SequenceEditorContext";
import { DoneEditingButton, SequenceBannerControls, SequenceTitleInput } from "../sequenceEditor/SequenceEditHeader";
import SequenceDescriptionEditor from "../sequenceEditor/SequenceDescriptionEditor";
import SequenceEditChapters from "../sequenceEditor/SequenceEditChapters";
import SequenceEditBottomBar from "../sequenceEditor/SequenceEditBottomBar";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionSubtitle from "../common/SectionSubtitle";
import ChaptersList from "./ChaptersList";
import FormatDate from "../common/FormatDate";
import SectionFooter from "../common/SectionFooter";
import UsersName from "../users/UsersName";
import { ContentItemBody } from "../contents/ContentItemBody";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import NotifyMeButton from "../notifications/NotifyMeButton";
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const SequencesPageFragmentQuery = gql(`
  query SequencesPage($documentId: String) {
    sequence(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...SequencesPageFragment
      }
    }
  }
`);

const SequencesEditQuery = gql(`
  query SequencesEdit($documentId: String) {
    sequence(input: { selector: { documentId: $documentId } }, allowNull: true) {
      result {
        ...SequencesEdit
      }
    }
  }
`);

export const sequencesImageScrim = (theme: ThemeType) => ({
  position: 'absolute',
  bottom: 0,
  height: 150,
  width: '100%',
  zIndex: theme.zIndexes.sequencesImageScrim,
  background: theme.palette.panelBackground.sequenceImageGradient,
})

const styles = defineStyles('SequencesPage', (theme: ThemeType) => ({
  root: {
    paddingTop: 380,
  },
  deletedText: {
    paddingTop: 20,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 30
    },
  },
  link: {
    color: theme.palette.primary.main
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 16,
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    },
  },
  titleCol: {
    flexGrow: 1
  },
  notifyCol: {
    flex: 'none',
    paddingTop: 3,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 0
    },
  },
  titleWrapper: {
    paddingLeft: 4
  },
  title: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    marginTop: 0,
    ...theme.typography.smallCaps,
  },
  description: {
    marginTop: 16,
    marginLeft: 4,
    marginBottom: 16,
  },
  banner: {
    position: "absolute",
    right: 0,
    top: "var(--header-height)",
    width: "100vw",
    height: 380,
    zIndex: theme.zIndexes.sequenceBanner,
    [theme.breakpoints.down('sm')]: {
      top: "var(--header-height)",
    },
    "& img": {
      width: "100vw",
    },
  },
  bannerWrapper: {
    position: "relative",
    height: 380,
    backgroundColor: theme.palette.panelBackground.sequencesBanner,
  },
  meta: {
    ...theme.typography.body2,
    ...sectionFooterLeftStyles
  },
  metaItem: {
    marginRight: 8
  },
  content: {
    padding: 32,
    position: 'relative',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    marginTop: -127,
    zIndex: theme.zIndexes.sequencesPageContent,
    [theme.breakpoints.down('sm')]: {
      marginTop: -100,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 8,
      padding: 8
    },
  },
  leftAction: {
    [theme.breakpoints.down('xs')]: {
      textAlign: 'left'
    }
  },
  edit: {
    marginTop: 12,
  },
  imageScrim: {
    ...sequencesImageScrim(theme)
  },
  editToggle: {
    cursor: "pointer",
  },
  // In edit mode the title is an input; keep "[Draft]" on the same line.
  titleEditing: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  draftLabel: {
    whiteSpace: "nowrap",
  },
  titleInput: {
    flex: 1,
    minWidth: 0,
  },
}))

const SequencesPage = ({documentId}: {
  documentId: string,
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useSubscribedLocation();
  const navigate = useNavigate();

  const { loading, data } = useQuery(SequencesPageFragmentQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.sequence?.result;

  const canEdit = !!document && (userCanDo(currentUser, 'sequences.edit.all') || (userCanDo(currentUser, 'sequences.edit.own') && userOwns(currentUser, document)));
  const editing = canEdit && query.edit === "true";

  const { data: editDocument } = useQuery(SequencesEditQuery, {
    variables: { documentId: documentId },
    skip: !editing,
  });
  const editableDocument = editDocument?.sequence?.result ?? undefined;

  const setEditing = (edit: boolean) => {
    const newQuery = edit ? { ...query, edit: "true" } : omit(query, "edit");
    navigate({ search: isEmpty(newQuery) ? "" : `?${qs.stringify(newQuery)}` }, { replace: true, scroll: false });
  };

  if (document?.isDeleted) {
    return <SingleColumnSection>
      <StatusCodeSetter status={200}/>
      <Typography variant="body2" className={classes.deletedText}>
        This sequence has been deleted. <Link to="/library" className={classes.link}>Click here to view all sequences.</Link>
      </Typography>
    </SingleColumnSection>
  }
  if (loading) return <Loading />

  if (!document) {
    return <Error404/>
  }

  if (!canEdit && document.draft)
    throw new Error('This sequence is a draft and is not publicly visible')

  if (editing && !editableDocument) {
    return <Loading />
  }

  const { html = "" } = document.contents || {}

  const bannerId = document.bannerImageId || defaultSequenceBannerIdSetting.get(forumType);

  const editToggle = canEdit && (editing
    ? <DoneEditingButton className={classes.editToggle} onDone={() => setEditing(false)} />
    : <a className={classes.editToggle} onClick={() => setEditing(true)}>Edit</a>);

  const page = <AnalyticsContext pageContext="sequencesPage">
    <StatusCodeSetter status={200}/>
    <div className={classes.root}>
      {bannerId && <div className={classes.banner}>
        <div className={classes.bannerWrapper}>
          <DeferRender ssr={false}>
            <div>
              <CloudinaryImage
                publicId={bannerId}
                width="auto"
                height="380"
              />
              <div className={classes.imageScrim}/>
            </div>
          </DeferRender>
          {editing && <SequenceBannerControls />}
        </div>
      </div>}
      <SingleColumnSection>
        <div className={classes.content}>
          <section className={classes.topSection}>
            <div className={classes.titleCol}>
              <div className={classes.titleWrapper}>
                <Typography variant='display2' className={classNames(classes.title, editing && classes.titleEditing)}>
                  {document.draft && <span className={classes.draftLabel}>[Draft] </span>}
                  {editing ? <SequenceTitleInput className={classes.titleInput} /> : document.title}
                </Typography>
              </div>
              <SectionFooter>
                <div className={classes.meta}>
                  <span className={classes.metaItem}><FormatDate date={document.createdAt} format="MMM DD, YYYY"/></span>
                  {document.user && <span className={classes.metaItem}> by <UsersName user={document.user} /></span>}
                </div>
                {!allowSubscribeToSequencePosts() && editToggle && <span className={classes.leftAction}>
                  <SectionSubtitle>{editToggle}</SectionSubtitle>
                </span>}
              </SectionFooter>
            </div>
            {allowSubscribeToSequencePosts() && <div className={classes.notifyCol}>
              <AnalyticsContext pageElementContext="notifyMeButton">
                <NotifyMeButton
                  document={document}
                  tooltip="Get notified when a new post is added to this sequence"
                  subscribeMessage="Get notified"
                  unsubscribeMessage="Notifications set"
                  showIcon
                  asButton={isFriendlyUI()}
                  hideFlashes
                />
              </AnalyticsContext>
              {editToggle && <SectionFooter className={classes.edit}>
                <SectionSubtitle>{editToggle}</SectionSubtitle>
              </SectionFooter>}
            </div>}
          </section>

          {editing
            ? <SequenceDescriptionEditor />
            : html && <ContentStyles contentType="post" className={classes.description}>
                <ContentItemBody dangerouslySetInnerHTML={{__html: html}} description={`sequence ${document._id}`} nofollow={(document.user?.karma || 0) < nofollowKarmaThreshold.get(forumType)}/>
              </ContentStyles>
          }
          <div>
            {editing
              ? <SequenceEditChapters sequenceId={document._id} />
              : <AnalyticsContext listContext={"sequencePage"} sequenceId={document._id} capturePostItemOnMount>
                  <ChaptersList sequenceId={document._id} />
                </AnalyticsContext>
            }
          </div>
        </div>
      </SingleColumnSection>
      {editing && <SequenceEditBottomBar />}
    </div>
  </AnalyticsContext>;

  return editing && editableDocument
    ? <SequenceEditorProvider sequence={editableDocument}>{page}</SequenceEditorProvider>
    : page;
}

export default SequencesPage
