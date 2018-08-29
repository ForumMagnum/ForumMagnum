import {
  Components,
  registerComponent,
  withCurrentUser,
  getSetting,
  Utils
} from 'meteor/vulcan:core';
import { Image } from 'cloudinary-react';
import NoSSR from 'react-no-ssr';
import React, { PureComponent } from 'react';
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

class SequencesGridItem extends PureComponent {
  getSequenceUrl = () => {
    return '/s/' + this.props.sequence._id
  }

  handleClick = (event) => {
    const url = this.getSequenceUrl()
    const navigate = this.props.router.push
    Utils.manualClickNavigation(event, url, navigate)
  }

  render() {
    const { sequence, showAuthor=false, classes } = this.props
    const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')

    return <div className={classNames("sequences-grid-item", classes.root)} onClick={this.handleClick}>
      <div className={classNames("sequences-grid-item-top", {author: showAuthor})} style={{borderTopColor: sequence.color}}>
        <Link key={sequence._id} className="sequences-grid-item-link" to={this.getSequenceUrl()}>
          <Typography variant='title' className="sequences-grid-item-title">
            {sequence.draft && <span className="sequences-grid-item-title-draft">[Draft] </span>}
            {sequence.title}
          </Typography>
        </Link>
        { showAuthor &&
          <div className="sequences-grid-item-author">
            by <Link to={Users.getProfileUrl(sequence.user)}>{Users.getDisplayName(sequence.user)}</Link>
          </div>}
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
  }
}

SequencesGridItem.displayName = "SequencesGridItem";

registerComponent('SequencesGridItem', SequencesGridItem, withCurrentUser, withStyles(styles), withRouter);
