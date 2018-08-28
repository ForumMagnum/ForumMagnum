import {
  Components,
  registerComponent,
  withCurrentUser,
  getSetting
} from 'meteor/vulcan:core';
import { Image } from 'cloudinary-react';
import NoSSR from 'react-no-ssr';
import React from 'react';
import Users from 'meteor/vulcan:users';
import { Link, withRouter } from 'react-router';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    ...theme.typography.postStyle,
    cursor: 'pointer',
  }
})

const SequencesGridItem = ({
  sequence,
  currentUser,
  showAuthor=false,
  classes,
  router
}) => {
  // const allPostsList = sequence.chapters && _.reduce(sequence.chapters, (memo, c) => [...memo, ...c.posts], []);
  // const totalPostsNumber = _.reduce(sequence.chapters, (memo, c) => [...memo, ...c.postIds], []).length;
  // <div className="sequences-grid-item-progress" style={{color: sequence.color}}>{totalPostsNumber} articles</div>

  // const readPostsNumber = allPostsList && _.filter(allPostsList, (p) => p && p.lastVisitedAt).length;
  const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')
  const sequenceUrl = '/s/' + sequence._id
  return <div className={classNames("sequences-grid-item", classes.root)} onClick={() => router.push(sequenceUrl)}>
    <div className={classNames("sequences-grid-item-top", {author: showAuthor})} style={{borderTopColor: sequence.color}}>
      <Link key={sequence._id} className="sequences-grid-item-link" to={"/s/"+sequence._id}>
        <Typography variant='title' className="sequences-grid-item-title">
          {sequence.draft && <span className="sequences-grid-item-title-draft">[Draft] </span>}
          {sequence.title}
        </Typography>
      </Link>
      { showAuthor &&
        <Link to={Users.getProfileUrl(sequence.user)} onClick={(e) => e.stopPropagation()}>
          {/* Prevent event from triggering parent navigation onClick method */}
          <div className="sequences-grid-item-author">
            by {Users.getDisplayName(sequence.user)}
          </div>
        </Link>}
      </div>
      <div className="sequences-grid-item-bottom">
        <div className="sequences-grid-item-image">
          <NoSSR>
            <Image
              publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
              dpr="auto"
              responsive={true}
              sizes="100vw"
              cloudName={cloudinaryCloudName}
              quality="auto"
              height={124}
              width={315}
              crop="fill"
              gravity="custom"
            />
          </NoSSR>
        </div>
      </div>

  </div>;
};

SequencesGridItem.displayName = "SequencesGridItem";

registerComponent('SequencesGridItem', SequencesGridItem, withCurrentUser, withStyles(styles), withRouter);
