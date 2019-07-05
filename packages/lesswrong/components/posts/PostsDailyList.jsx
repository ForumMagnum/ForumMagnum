import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import { Posts } from '../../lib/collections/posts';
import { withCurrentUser, withList, getSetting, Components, registerComponent } from 'meteor/vulcan:core';
import withTimezone from '../common/withTimezone';
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames';

const styles = theme => ({
  loading: {
    opacity: .4,
  },
  loadMore: {
    ...theme.typography.postStyle,
    color: theme.palette.primary.main
  }
})

class PostsDailyList extends PureComponent {

  constructor(props) {
    super(props);
    this.loadMoreDays = this.loadMoreDays.bind(this);
    this.state = {
      days: props.days,
      after: props.terms.after,
      daysLoaded: props.days,
      afterLoaded: props.terms.after,
      before: props.terms.before,
      //loading: true,
    };
  }

  // intercept prop change and only show more days once data is done loading
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.networkStatus === 2) {
      //this.setState({loading: true});
    } else {
      this.setState((prevState, props) => ({
        //loading: false,
        daysLoaded: prevState.days,
        afterLoaded: prevState.after,
      }));
    }
  }

  // Return a date string for each date which should have a section. This
  // includes all dates in the range
  getDateRange(after, before) {
    const mAfter = moment.utc(after, 'YYYY-MM-DD');
    const mBefore = moment.utc(before, 'YYYY-MM-DD');
    const daysCount = mBefore.diff(mAfter, 'days') + 1;
    const range = _.range(daysCount).map(
      i => moment.utc(before, 'YYYY-MM-DD').subtract(i, 'days')
        .tz(this.props.timezone)
        .format('YYYY-MM-DD')
    );
    return range;
  }

  getDatePosts(posts, date) {
    const { timeField } = this.props.terms
    return _.filter(posts, post =>
      moment(new Date(timeField ? post[timeField] : post.postedAt))
        .tz(this.props.timezone)
        .format('YYYY-MM-DD') === date);
  }

  groupByDate(posts) {
    const { timeField } = this.props.terms

    return _.groupBy(posts, post =>
      moment(new Date(timeField ? post[timeField] : post.postedAt))
        .tz(this.props.timezone)
        .format('YYYY-MM-DD'));
  }

  // variant 1: reload everything each time (works with polling)
  loadMoreDays(e) {
    e.preventDefault();
    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const loadMoreAfter = moment(this.state.after, 'YYYY-MM-DD').subtract(numberOfDays, 'days').format('YYYY-MM-DD');

    this.props.loadMore({
      ...this.props.terms,
      after: loadMoreAfter,
    });

    this.setState({
      days: this.state.days + this.props.increment,
      after: loadMoreAfter,
    });
  }

  render() {
    const { dimWhenLoading, loading, loadingMore, classes, currentUser, networkStatus } = this.props
    const posts = this.props.results;
    const dates = this.getDateRange(this.state.afterLoaded, this.state.before);
    const { Loading, PostsDay } = Components

    const dim = dimWhenLoading && networkStatus !== 7

    if (loading && (!posts || !posts.length)) {
      return <Loading />
    } else {
      return (
        <div className={classNames({[classes.loading]: dim})}>
          {loading && <Loading />}
          {dates.map((date, index) =>
            <PostsDay key={date.toString()}
              date={moment(date)}
              posts={this.getDatePosts(posts, date)}
              networkStatus={networkStatus}
              currentUser={currentUser}
              hideIfEmpty={index==0}
            />
          )}
          {loadingMore ?
            <Loading />
            :
            <Typography variant="body1" className={classes.loadMore} onClick={this.loadMoreDays}>
              <a>Load More Days</a>
            </Typography>
          }
        </div>
      )
    }
  }
}

PostsDailyList.propTypes = {
  currentUser: PropTypes.object,
  days: PropTypes.number,
  increment: PropTypes.number
};

PostsDailyList.defaultProps = {
  days: getSetting('forum.numberOfDays', 5),
  increment: getSetting('forum.numberOfDays', 5)
};

registerComponent('PostsDailyList', PostsDailyList,
  [withList, {
    collection: Posts,
    queryName: 'postsDailyListQuery',
    fragmentName: 'PostsList',
    limit: 0,
    ssr: true,
  }],
  withCurrentUser, withTimezone, withStyles(styles, {name: "PostsDailyList"})
);
