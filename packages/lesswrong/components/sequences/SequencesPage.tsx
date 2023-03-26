import React, { useState, useCallback } from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import NoSSR from 'react-no-ssr';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { sectionFooterLeftStyles } from '../users/UsersProfile'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import { isEAForum } from '../../lib/instanceSettings';

export const sequencesImageScrim = (theme: ThemeType) => ({
  position: 'absolute',
  bottom: 0,
  height: 150,
  width: '100%',
  zIndex: theme.zIndexes.sequencesImageScrim,
  background: theme.palette.panelBackground.sequenceImageGradient,
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 380,
  },
  titleWrapper: {
    paddingLeft: theme.spacing.unit/2
  },
  title: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    marginTop: 0,
    ...(isEAForum
      ? {textTransform: "uppercase"}
      : theme.typography.smallCaps),
  },
  description: {
    marginTop: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit/2,
    marginBottom: theme.spacing.unit * 2,
  },
  banner: {
    position: "absolute",
    right: 0,
    top: 60,
    width: "100vw",
    height: 380,
    zIndex: theme.zIndexes.sequenceBanner,
    [legacyBreakpoints.maxTiny]: {
      top: 40,
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
      marginTop: theme.spacing.unit,
      padding: theme.spacing.unit
    },
  },
  leftAction: {
    [theme.breakpoints.down('xs')]: {
      textAlign: 'left'
    }
  },
  imageScrim: {
    ...sequencesImageScrim(theme)
  }
})

const SequencesPage = ({ documentId, classes }: {
  documentId: string,
  classes: ClassesType
}) => {
  const [edit,setEdit] = useState(false);
  const [showNewChapterForm,setShowNewChapterForm] = useState(false);
  const currentUser = useCurrentUser();
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });

  const showEdit = useCallback(() => {
    setEdit(true);
  }, []);
  const showSequence = useCallback(() => {
    setEdit(false);
  }, []);

  const { SequencesEditForm, HeadTags, CloudinaryImage, SingleColumnSection, SectionSubtitle,
    ChaptersList, ChaptersNewForm, FormatDate, Loading, SectionFooter, UsersName,
    ContentItemBody, Typography, SectionButton, ContentStyles,
  } = Components
  
  if (document?.isDeleted) return <h3>This sequence has been deleted</h3>
  if (loading) return <Loading />
  
  if (!document) {
    return <Components.Error404/>
  }
  if (edit) return (
    <SequencesEditForm
      documentId={documentId}
      successCallback={showSequence}
      cancelCallback={showSequence}
    />
  )

  const canEdit = userCanDo(currentUser, 'sequences.edit.all') || (userCanDo(currentUser, 'sequences.edit.own') && userOwns(currentUser, document))
  const canCreateChapter = userCanDo(currentUser, 'chapters.new.all')
  const { html = "" } = document.contents || {}

  if (!canEdit && document.draft)
    throw new Error('This sequence is a draft and is not publicly visible')
    
  return <div className={classes.root}>
    <HeadTags canonicalUrl={sequenceGetPageUrl(document, true)} title={document.title}/>
    <div className={classes.banner}>
      <div className={classes.bannerWrapper}>
        <NoSSR>
          <div>
            <CloudinaryImage
              publicId={document.bannerImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
              width="auto"
              height="380"
            />
            <div className={classes.imageScrim}/>
          </div>
        </NoSSR>
      </div>
    </div>
    <SingleColumnSection>
      <div className={classes.content}>
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
          {canEdit && <span className={classes.leftAction}><SectionSubtitle>
            <a onClick={showEdit}>edit</a>
          </SectionSubtitle></span>}
        </SectionFooter>
        
        <ContentStyles contentType="post" className={classes.description}>
          {html && <ContentItemBody dangerouslySetInnerHTML={{__html: html}} description={`sequence ${document._id}`} nofollow={(document.user?.karma || 0) < nofollowKarmaThreshold.get()}/>}
        </ContentStyles>
        <div>
          <AnalyticsContext listContext={"sequencePage"} sequenceId={document._id} capturePostItemOnMount>
            <ChaptersList sequenceId={document._id} canEdit={canEdit} />
          </AnalyticsContext>
          {canCreateChapter && <SectionFooter>
            <SectionButton>
              <a onClick={() => setShowNewChapterForm(true)}>Add Chapter</a>
            </SectionButton>
          </SectionFooter>}
          {showNewChapterForm && <ChaptersNewForm prefilledProps={{sequenceId: document._id}}/>}
        </div>
      </div>
    </SingleColumnSection>
  </div>
}

const SequencesPageComponent = registerComponent('SequencesPage', SequencesPage, {styles});

declare global {
  interface ComponentTypes {
    SequencesPage: typeof SequencesPageComponent
  }
}
