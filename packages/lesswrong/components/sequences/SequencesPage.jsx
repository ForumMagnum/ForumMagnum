import React, { PropTypes, Component } from 'react';
import { Components, withDocument, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import moment from 'moment';
import { Image } from 'cloudinary-react';
import NoSSR from 'react-no-ssr';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';

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
    const {document, currentUser, loading} = this.props;
    if (document && document.isDeleted) {
      return <h3>This sequence has been deleted</h3>
    } if (loading || !document) {
      return <Components.Loading />
    } else if (this.state.edit) {
      return <Components.SequencesEditForm
        documentId={document._id}
        successCallback={this.showSequence}
        cancelCallback={this.showSequence} />
    } else {
      const date = moment(new Date(document.createdAt)).format('MMM DD, YYYY');
      const canEdit = Users.canDo(currentUser, 'sequences.edit.all') || (Users.canDo(currentUser, 'sequences.edit.own') && Users.owns(currentUser, document))
      const canCreateChapter = Users.canDo(currentUser, 'chapters.new.all')


      return (<div className="sequences-page">
        <div className="sequences-banner">
          <div className="sequences-banner-wrapper">
            <NoSSR>
              <div className="sequences-image">
                <Image publicId={document.bannerImageId || "Group_ybgiy6.png"} cloudName="lesswrong-2-0" quality="auto" sizes="100vw" responsive={true} width="auto" height="380" dpr="auto" crop="fill" gravity="custom" />
                <div className="sequences-image-scrim-overlay"></div>
              </div>
            </NoSSR>
            <div className="sequences-title-wrapper">
              <div className="sequences-title">
                {document.draft && <span className="sequences-page-content-header-title-draft">[Draft] </span>}{document.title}
              </div>
            </div>
          </div>
        </div>
        <Components.Section titleComponent={
          <div className="sequences-meta">
            <div className="sequences-date">
              {date}
            </div>
            <div className="sequences-comment-count">
              {document.commentCount || 0} comments
            </div>
            {document.userId ? <div className="sequences-author-top">
              by <Link className="sequences-author-top-name" to={Users.getProfileUrl(document.user)}>{document.user.displayName}</Link>
            </div> : null}
            {canEdit ? <a onTouchTap={this.showEdit}>edit</a> : null}
          </div>}>
          <div className="sequences-description content-body">
            {document.htmlDescription && <div className="content-body" dangerouslySetInnerHTML={{__html: document.htmlDescription}}/>}
          </div>
        </Components.Section>
        <div className="sequences-chapters">
          <Components.ChaptersList terms={{view: "SequenceChapters", sequenceId: document._id}} canEdit={canEdit} />
          {canCreateChapter ? <Components.ChaptersNewForm prefilledProps={{sequenceId: document._id}}/> : null}
        </div>
        {/*<div className="sequences-page-content-footer">
          <div className="sequences-page-content-footer-voting">
            <Components.Vote collection={Posts} document={document} currentUser={currentUser}/>
          </div>
          <div className="sequences-page-content-footer-author">
            <Components.UsersName user={document.user} />
          </div>
        </div>
        <Components.PostsCommentsThreadWrapper terms={{postId: document._id, view: 'postCommentsTop'}} userId={document.userId} /> */}
      </div>)
    }
  }
}

const options = {
  collection: Sequences,
  queryName: "SequencesPageQuery",
  fragmentName: 'SequencesPageFragment',
  totalResolver: false,
};


registerComponent('SequencesPage', SequencesPage, [withDocument, options], withCurrentUser);
