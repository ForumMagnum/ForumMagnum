import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  dayTitle: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit,
    whiteSpace: "pre",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle
  },
  noPosts: {
    marginLeft: "23px",
    color: "rgba(0,0,0,0.5)",
  },
})

class PostsDay extends PureComponent {

  render() {
    const { date, posts, classes } = this.props;
    const noPosts = posts.length === 0;

    return (
      <div className="posts-day">
        <Typography variant="display2" className={classes.dayTitle}>
          <Hidden xsDown implementation="css">
            {date.format('dddd, MMMM Do YYYY')}
          </Hidden>
          <Hidden smUp implementation="css">
            {date.format('ddd, MMM Do YYYY')}
          </Hidden>
        </Typography>
        { noPosts ? (<div className={classes.noPosts}>No posts on {date.format('MMMM Do YYYY')}</div>) :
          <div className="posts-list">
            <div className="posts-list-content">
              {posts.map((post, index) => <Components.PostsItem post={post} key={post._id} index={index} currentUser={this.props.currentUser} />)}
            </div>
          </div>
        }
      </div>
    );
  }
}

PostsDay.propTypes = {
  currentUser: PropTypes.object,
  date: PropTypes.object,
  number: PropTypes.number
};

registerComponent('PostsDay', PostsDay, withStyles(styles, { name: "PostsDay" }));
