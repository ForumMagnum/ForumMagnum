import {
  Components,
  registerComponent,
  withCurrentUser,
  Utils
} from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import React, { PureComponent } from 'react';
import Users from 'meteor/vulcan:users';
import { Link, withRouter } from 'react-router';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import defineComponent from '../../lib/defineComponent';

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
            <Components.CloudinaryImage
              publicId={sequence.gridImageId || "sequences/vnyzzznenju0hzdv6pqb.jpg"}
              height={124}
              width={315}
            />
          </NoSSR>
        </div>
      </div>
    </div>;
  }
}

export default defineComponent({
  name: 'SequencesGridItem',
  component: SequencesGridItem,
  styles: styles,
  hocs: [ withCurrentUser, withRouter ]
});
