import React, { Component } from 'react';
import {
  Components,
  withDocument,
  registerComponent,
} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import NoSSR from 'react-no-ssr';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import { postBodyStyles } from '../../themes/stylePiping'

// TODO: Styling overhaul.

const styles = theme => ({
  root: {
    paddingTop: 380,
    marginRight: 90,
    
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    },
  },
  titleWrapper: {
  },
  title: {
    fontVariant: "small-caps",
    color: "white",
    ...theme.typography.postStyle,
    
    [theme.breakpoints.down('sm')]: {
    },
  },
  description: {
    marginTop: -6,
    marginLeft: 10,
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
    marginTop: -4,
    lineHeight: 1.1,
    color: "rgba(0,0,0,0.5)",
    
    [theme.breakpoints.down('sm')]: {
      textAlign: "center",
    },
  },
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

  // Are sequences (as opposed to sequence-posts) a type
  // of entity that people should be able to comment on?
  // Maybe, at some point in the future? The current answer
  // however is "no" (reflected in this function, and the
  // comments widget being commented out below).
  commentsEnabled = () => {
    return false;
  }

  render() {
    const { document, currentUser, loading, classes } = this.props;
    if (document && document.isDeleted) {
      return <h3>This sequence has been deleted</h3>
    } else if (loading || !document) {
      return <Components.Loading />
    } else if (this.state.edit) {
      return <Components.SequencesEditForm
        documentId={document._id}
        successCallback={this.showSequence}
        cancelCallback={this.showSequence} />
    } else {
      const canEdit = Users.canDo(currentUser, 'sequences.edit.all') || (Users.canDo(currentUser, 'sequences.edit.own') && Users.owns(currentUser, document))
      const canCreateChapter = Users.canDo(currentUser, 'chapters.new.all')
      const { html = "" } = document.contents || {}

      return (<div className={classes.root}>
        <Components.HeadTags url={Sequences.getPageUrl(document, true)} title={document.title}/>
        <div className={classes.banner}>
          <div className={classes.bannerWrapper}>
            <NoSSR>
              <div className="sequences-image">
                <Components.CloudinaryImage
                  publicId={document.bannerImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
                  width="auto"
                  height="380"
                />
                <div className="sequences-image-scrim-overlay"></div>
              </div>
            </NoSSR>
            <div className={classNames(classes.titleWrapper, "sequences-title-wrapper")}>
              <Typography variant='display2' className={classNames("sequences-title", classes.title)}>
                {document.draft && <span className="sequences-page-content-header-title-draft">[Draft] </span>}{document.title}
              </Typography>
            </div>
          </div>
        </div>
        <Components.Section titleComponent={
          <div className={classes.meta}>
            <Typography variant="subheading"><strong>
              <Components.FormatDate date={document.createdAt} format="MMM DD, YYYY"/>
            </strong></Typography>
            { this.commentsEnabled() && (
              <div className="sequences-comment-count">
                {document.commentCount || 0} comments
              </div>)}
            {document.userId && <Typography variant="subheading">
              by <Link to={Users.getProfileUrl(document.user)}>
                {document.user.displayName}
              </Link>
            </Typography>}
            {canEdit && <Components.SectionSubtitle>
              <a onClick={this.showEdit}>edit</a></Components.SectionSubtitle>}
          </div>}>
          <div className={classNames(classes.description, "content-body")}>
            {html && <div className="content-body" dangerouslySetInnerHTML={{__html: html}}/>}
          </div>
        </Components.Section>
        <div className="sequences-chapters">
          <Components.ChaptersList terms={{view: "SequenceChapters", sequenceId: document._id}} canEdit={canEdit} />
          {canCreateChapter ? <Components.ChaptersNewForm prefilledProps={{sequenceId: document._id}}/> : null}
        </div>
      </div>)
    }
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
