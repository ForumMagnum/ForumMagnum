import React, { useState, useCallback, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { sectionFooterLeftStyles } from '../users/UsersProfile'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { DatabasePublicSetting, nofollowKarmaThreshold } from '../../lib/publicSettings';
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from '../common/Header';
import { isFriendlyUI } from '../../themes/forumTheme';
import { makeCloudinaryImageUrl } from '../common/CloudinaryImage2';
import { allowSubscribeToSequencePosts } from '../../lib/betas';
import { Link } from '../../lib/reactRouterWrapper';
import DeferRender from '../common/DeferRender';
import { ChaptersForm } from './ChaptersForm';
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import SequencesEditForm from "./SequencesEditForm";
import HeadTags from "../common/HeadTags";
import CloudinaryImage from "../common/CloudinaryImage";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionSubtitle from "../common/SectionSubtitle";
import ChaptersList from "./ChaptersList";
import FormatDate from "../common/FormatDate";
import SectionFooter from "../common/SectionFooter";
import UsersName from "../users/UsersName";
import ContentItemBody from "../common/ContentItemBody";
import { Typography } from "../common/Typography";
import SectionButton from "../common/SectionButton";
import ContentStyles from "../common/ContentStyles";
import NotifyMeButton from "../notifications/NotifyMeButton";

export const sequencesImageScrim = (theme: ThemeType) => ({
  position: 'absolute',
  bottom: 0,
  height: 150,
  width: '100%',
  zIndex: theme.zIndexes.sequencesImageScrim,
  background: theme.palette.panelBackground.sequenceImageGradient,
})

export const defaultSequenceBannerIdSetting = new DatabasePublicSetting<string|null>("defaultSequenceBannerId", null)

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: isFriendlyUI ? (270 + HEADER_HEIGHT) : 380,
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
    paddingLeft: theme.spacing.unit/2
  },
  title: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    marginTop: 0,
    ...theme.typography.smallCaps,
  },
  description: {
    marginTop: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit/2,
    marginBottom: isFriendlyUI ? 40 : theme.spacing.unit * 2,
  },
  banner: {
    position: "absolute",
    right: 0,
    top: HEADER_HEIGHT,
    width: "100vw",
    height: 380,
    zIndex: theme.zIndexes.sequenceBanner,
    [theme.breakpoints.down('sm')]: {
      top: MOBILE_HEADER_HEIGHT,
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
    marginRight: theme.spacing.unit
  },
  content: {
    padding: theme.spacing.unit * 4,
    position: 'relative',
    backgroundColor: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    marginTop: -127,
    zIndex: theme.zIndexes.sequencesPageContent,
    [theme.breakpoints.down('sm')]: {
      marginTop: -100,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: isFriendlyUI ? undefined : theme.spacing.unit,
      padding: isFriendlyUI ? 16 : theme.spacing.unit
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
  newChapterForm: {
    maxWidth: 695,
    marginLeft: "auto",
    marginRight: 90,
    padding: 15,
    border: theme.palette.border.normal,
    borderRadius: 2,
    marginBottom: "2em",
  
    "& form": {
      clear: "both",
      overflow: "auto",
    },
    "& .form-submit": {
      float: "right",
    },
    "& h3": {
      fontSize: "2em",
      marginBottom: "1em",
    },
    "& label.control-label": {
      display: "none",
    },
    "& .col-sm-9": {
      padding: 0,
    },
    "& .input-title input": {
      fontSize: "2em",
    },
  },
})

const SequencesPage = ({ documentId, classes }: {
  documentId: string,
  classes: ClassesType<typeof styles>
}) => {
  const [edit,setEdit] = useState(false);
  const [showNewChapterForm,setShowNewChapterForm] = useState(false);
  const nextSuggestedNumberRef = useRef(1);

  const currentUser = useCurrentUser();
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });

  const { document: editDocument, loading: editLoading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: 'SequencesEdit',
    skip: !edit,
  });

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showSequence = useCallback(() => {
    setEdit(false);
  }, []);
  if (document?.isDeleted) {
    return <SingleColumnSection>
      <Typography variant="body2" className={classes.deletedText}>
        This sequence has been deleted. <Link to="/library" className={classes.link}>Click here to view all sequences.</Link>
      </Typography>
    </SingleColumnSection>
  }
  if (loading) return <Loading />
  
  if (!document) {
    return <Error404/>
  }
  if (edit) {
    if (!currentUser) {
      return <div>You must be logged in to edit this sequence.</div>
    }
    if (editLoading) {
      return <Loading />
    }
    if (!editDocument) {
      return <Error404/>
    }
    return (
      <SequencesEditForm
        sequence={editDocument}
        currentUser={currentUser}
        successCallback={showSequence}
        cancelCallback={showSequence}
      />
    )
  }

  const canEdit = userCanDo(currentUser, 'sequences.edit.all') || (userCanDo(currentUser, 'sequences.edit.own') && userOwns(currentUser, document))
  const canCreateChapter = userCanDo(currentUser, 'chapters.new.all')
  const canEditChapter = userCanDo(currentUser, 'chapters.edit.all') || canEdit
  const { html = "", plaintextDescription } = document.contents || {}

  if (!canEdit && document.draft)
    throw new Error('This sequence is a draft and is not publicly visible')

  const bannerId = document.bannerImageId || defaultSequenceBannerIdSetting.get();
  const socialImageId = document.gridImageId || document.bannerImageId;
  const socialImageUrl = socialImageId ? makeCloudinaryImageUrl(socialImageId, {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces",
  }) : undefined;
    
  return <AnalyticsContext pageContext="sequencesPage">
    <div className={classes.root}>
      <HeadTags
        canonicalUrl={sequenceGetPageUrl(document, true)}
        title={document.title}
        description={plaintextDescription || undefined}
        image={socialImageUrl}
        noIndex={document.noindex}
      />
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
        </div>
      </div>}
      <SingleColumnSection>
        <div className={classes.content}>
          <section className={classes.topSection}>
            <div className={classes.titleCol}>
              <div className={classes.titleWrapper}>
                <Typography variant='display2' className={classes.title}>
                  {document.draft && <span>[Draft] </span>}{document.title}
                </Typography>
              </div>
              <SectionFooter>
                <div className={classes.meta}>
                  <span className={classes.metaItem}><FormatDate date={document.createdAt} format="MMM DD, YYYY"/></span>
                  {document.user && <span className={classes.metaItem}> by <UsersName user={document.user} /></span>}
                </div>
                {!allowSubscribeToSequencePosts && canEdit && <span className={classes.leftAction}>
                  <SectionSubtitle>
                    <a onClick={showEdit}>edit</a>
                  </SectionSubtitle>
                </span>}
              </SectionFooter>
            </div>
            {allowSubscribeToSequencePosts && <div className={classes.notifyCol}>
              <AnalyticsContext pageElementContext="notifyMeButton">
                <NotifyMeButton
                  document={document}
                  tooltip="Get notified when a new post is added to this sequence"
                  subscribeMessage="Get notified"
                  unsubscribeMessage="Notifications set"
                  showIcon
                  asButton={isFriendlyUI}
                  hideFlashes
                />
              </AnalyticsContext>
              {canEdit && <SectionFooter className={classes.edit}>
                <SectionSubtitle>
                  <a onClick={showEdit}>Edit sequence</a>
                </SectionSubtitle>
              </SectionFooter>}
            </div>}
          </section>
          
          {html && <ContentStyles contentType="post" className={classes.description}>
            <ContentItemBody dangerouslySetInnerHTML={{__html: html}} description={`sequence ${document._id}`} nofollow={(document.user?.karma || 0) < nofollowKarmaThreshold.get()}/>
          </ContentStyles>}
          <div>
            <AnalyticsContext listContext={"sequencePage"} sequenceId={document._id} capturePostItemOnMount>
              <ChaptersList sequenceId={document._id} canEdit={canEditChapter} nextSuggestedNumberRef={nextSuggestedNumberRef} />
            </AnalyticsContext>
            {canCreateChapter && <SectionFooter>
              <SectionButton>
                <a onClick={() => setShowNewChapterForm(true)}>Add Chapter</a>
              </SectionButton>
            </SectionFooter>}
            {showNewChapterForm && (
              <div className={classes.newChapterForm}>
                <h3>Add Chapter</h3>
                <ChaptersForm
                  prefilledProps={{ sequenceId: document._id, number: nextSuggestedNumberRef.current }}
                  onSuccess={() => setShowNewChapterForm(false)}
                  onCancel={() => setShowNewChapterForm(false)}
                />
              </div>
            )}
          </div>
        </div>
      </SingleColumnSection>
    </div>
  </AnalyticsContext>
}

export default registerComponent('SequencesPage', SequencesPage, {styles});


