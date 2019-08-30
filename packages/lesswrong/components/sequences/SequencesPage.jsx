import React, { Component } from 'react';
import {
  Components,
  withDocument,
  registerComponent,
} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import NoSSR from 'react-no-ssr';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import { postBodyStyles } from '../../themes/stylePiping'
import { sectionFooterLeftStyles } from '../users/UsersProfile'

export const sequencesImageScrim = theme => ({
  position: 'absolute',
  bottom: 0,
  height: 150,
  width: '100%',
  zIndex: theme.zIndexes.sequencesImageScrim,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 42%, rgba(255, 255, 255, 0) 100%)'
})

const styles = theme => ({
  root: {
    paddingTop: 380,
  },
  titleWrapper: {
    paddingLeft: theme.spacing.unit
  },
  title: {
    ...theme.typography.postStyle,
    fontVariant: "small-caps",
    marginTop: 0
  },
  description: {
    marginTop: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
    ...postBodyStyles(theme),
  },
  banner: {
    position: "absolute",
    right: 0,
    top: 60,
    width: "100vw",
    height: 380,
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  meta: {
    ...theme.typography.body1,
    ...sectionFooterLeftStyles
  },
  metaItem: {
    marginRight: theme.spacing.unit
  },
  content: {
    padding: theme.spacing.unit * 4,
    position: 'relative',
    backgroundColor: 'white',
    marginTop: -200,
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

class SequencesPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
    }
  }

  showEdit = () => {
    this.setState({edit: true})
  }

  showSequence = () => {
    this.setState({edit: false})
  }

  render() {
    const { document, currentUser, loading, classes } = this.props;
    const { SequencesEditForm, HeadTags, CloudinaryImage, SingleColumnSection, SectionSubtitle,
      ChaptersList, ChaptersNewForm, FormatDate, Loading, SectionFooter, UsersName, ContentItemBody } = Components
    if (document && document.isDeleted) return <h3>This sequence has been deleted</h3>
    if (loading || !document) return <Loading />
    if (this.state.edit) return (
      <SequencesEditForm
        documentId={document._id}
        successCallback={this.showSequence}
        cancelCallback={this.showSequence} />
    )

    const canEdit = Users.canDo(currentUser, 'sequences.edit.all') || (Users.canDo(currentUser, 'sequences.edit.own') && Users.owns(currentUser, document))
    const canCreateChapter = Users.canDo(currentUser, 'chapters.new.all')
    const { html = "" } = document.contents || {}

    return <div className={classes.root}>
      <HeadTags url={Sequences.getPageUrl(document, true)} title={document.title}/>
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
            <Typography variant='h3' className={classes.title}>
              {document.draft && <span>[Draft] </span>}{document.title}
            </Typography>
          </div>
          <SectionFooter>
            <div className={classes.meta}>
              <span className={classes.metaItem}><FormatDate date={document.createdAt} format="MMM DD, YYYY"/></span>
              {document.userId && <span className={classes.metaItem}> by <UsersName user={document.user}>
                {document.user.displayName}
              </UsersName></span>}
            </div>
            {canEdit && <span className={classes.leftAction}><SectionSubtitle>
              <a onClick={this.showEdit}>edit</a>
            </SectionSubtitle></span>}
          </SectionFooter>
          
          <div className={classes.description}>
            {html && <ContentItemBody dangerouslySetInnerHTML={{__html: html}}/>}
          </div>
          <div>
            <ChaptersList terms={{view: "SequenceChapters", sequenceId: document._id}} canEdit={canEdit} />
            {canCreateChapter ? <ChaptersNewForm prefilledProps={{sequenceId: document._id}}/> : null}
          </div>
        </div>
      </SingleColumnSection>
    </div>
    }
}

const options = {
  collection: Sequences,
  queryName: "SequencesPageQuery",
  fragmentName: 'SequencesPageFragment',
  enableTotal: false,
  ssr: true,
};


registerComponent('SequencesPage', SequencesPage, [withDocument, options], withUser, withStyles(styles, { name: "SequencesPage" }));
