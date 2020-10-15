import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withMulti } from '../../lib/crud/withMulti';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import moment from '../../lib/moment-timezone';
import { Posts } from '../../lib/collections/posts';
import { timeframeToTimeBlock } from './timeframeUtils'
import { queryIsUpdating } from '../common/queryStatusUtils'
import withTimezone from '../common/withTimezone';
import { QueryLink } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  timeBlockTitle: {
    whiteSpace: "pre",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
    position: "sticky",
    paddingTop: 4,
    paddingBottom: 4,
    zIndex: 1
  },
  loadMore: {
    marginTop: 6,
  },
  noPosts: {
    marginLeft: "23px",
    color: "rgba(0,0,0,0.5)",
  },
  posts: {
    boxShadow: theme.boxShadow
  },
  frontpageSubtitle: {
    marginBottom: 6
  },
  otherSubtitle: {
    marginTop: 6,
    marginBottom: 6
  },
  divider: {/* Exists only to get overriden by the eaTheme */}
})

const postTypes = [
  {name: 'frontpage', postIsType: (post: PostsBase) => !!post.frontpageDate, label: 'Frontpage Posts'},
  {name: 'personal', postIsType: (post: PostsBase) => !post.frontpageDate, label: 'Personal Blogposts'}
]

interface ExternalProps {
  terms: any,
  timeBlockLoadComplete: any,
  startDate: any,
  hideIfEmpty: any,
  timeframe: any,
  displayShortform: any
}
interface PostsTimeBlockProps extends ExternalProps, WithUserProps, WithTimezoneProps, WithStylesProps {
  results: Array<PostsList>|null,
  totalCount: any,
  loading: any,
  loadMore: any,
  networkStatus: any,
}
interface PostsTimeBlockState {
  noShortform: boolean,
}

class PostsTimeBlock extends Component<PostsTimeBlockProps,PostsTimeBlockState> {
  constructor (props: PostsTimeBlockProps) {
    super(props)
    this.reportEmptyShortform = this.reportEmptyShortform.bind(this);
    this.state = {
      noShortform: false
    }
  }

  componentDidMount () {
    const {networkStatus} = this.props
    this.checkLoaded(networkStatus)
  }

  componentDidUpdate (prevProps) {
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus} = this.props
    if (prevNetworkStatus !== networkStatus) {
      this.checkLoaded(networkStatus)
    }
  }

  checkLoaded (networkStatus) {
    const { timeBlockLoadComplete } = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    if (!queryIsUpdating(networkStatus) && timeBlockLoadComplete) {
      timeBlockLoadComplete()
    }
  }

  // Child component needs a way to tell us about the presence of shortforms
  reportEmptyShortform () {
    if (!this.state.noShortform) {
      this.setState({
        noShortform: true
      })
    }
  }

  getTitle (startDate, timeframe, size) {
    if (timeframe === 'yearly') return startDate.format('YYYY')
    if (timeframe === 'monthly') return startDate.format('MMMM YYYY')
    let result = size === 'smUp' ? startDate.format('ddd, MMM Do YYYY') : startDate.format('dddd, MMMM Do YYYY')
    if (timeframe === 'weekly') result = `Week Of ${result}`
    return result
  }

  render () {
    const {
      startDate, results: posts, totalCount, loading, loadMore, hideIfEmpty, classes,
      timeframe, networkStatus, timezone, displayShortform = true
    } = this.props
    const { noShortform } = this.state
    const { PostsItem2, LoadMore, ShortformTimeBlock, Loading, ContentType } = Components
    const timeBlock = timeframeToTimeBlock[timeframe]

    const noPosts = !loading && (!posts || (posts.length === 0))
    // The most recent timeBlock is hidden if there are no posts or shortforms
    // on it, to avoid having an awkward empty partial timeBlock when it's close
    // to midnight.
    if (noPosts && noShortform && hideIfEmpty) {
      return null
    }

    const postGroups = postTypes.map(type => ({
      ...type,
      posts: posts?.filter(type.postIsType) || []
    }))

    return (
      <div className={classes.root}>
        <QueryLink merge query={{
          after: moment.tz(startDate, timezone).startOf(timeBlock).format("YYYY-MM-DD"), 
          before: moment.tz(startDate, timezone).endOf(timeBlock).add(1, 'd').format("YYYY-MM-DD"),
          limit: 100
        }}>
          <Typography variant="headline" className={classes.timeBlockTitle}>
            {['yearly', 'monthly'].includes(timeframe) && <div>
              {this.getTitle(startDate, timeframe, null)}
            </div>}
            {['weekly', 'daily'].includes(timeframe) && <div>
              <Hidden xsDown implementation="css">
                {this.getTitle(startDate, timeframe, 'xsDown')}
              </Hidden>
              <Hidden smUp implementation="css">
                {this.getTitle(startDate, timeframe, 'smUp')}
              </Hidden>
            </div>}
          </Typography>
        </QueryLink>

        { loading && <Loading /> }

        <div className={classes.dayContent}>
          { noPosts && <div className={classes.noPosts}>
            No posts for {
            timeframe === 'daily' ?
              startDate.format('MMMM Do YYYY') :
              // Should be pretty rare. Basically people running off the end of
              // the Forum history on yearly
              `this ${timeBlock}`
            }
          </div> }

          {postGroups.map(({name, posts, label}) => {
            if (posts?.length > 0) return <div key={name}>
              <div
                className={name === 'frontpage' ? classes.frontpageSubtitle : classes.otherSubtitle}
              >
                <ContentType type={name} label={label} />
              </div>
              <div className={classes.posts}>
                {posts.map((post, i) =>
                  <PostsItem2 key={post._id} post={post} index={i} dense showBottomBorder={i < posts.length -1}/>
                )}
              </div>
            </div>
          })}

          {(posts && posts.length<totalCount) && <div className={classes.loadMore}>
            <LoadMore
                loadMore={loadMore}
                count={posts.length}
                totalCount={totalCount}
                networkStatus={networkStatus}
              />
          </div>}
          {displayShortform && <ShortformTimeBlock
            reportEmpty={this.reportEmptyShortform}
            terms={{
              view: "topShortform",
              // NB: The comments before differs from posts in that before is not
              // inclusive
              before: moment.tz(startDate, timezone).endOf(timeBlock).toString(),
              after: moment.tz(startDate, timezone).startOf(timeBlock).toString()
            }}
          />}
        </div>
      </div>
    );
  }

};

const PostsTimeBlockComponent = registerComponent<ExternalProps>('PostsTimeBlock', PostsTimeBlock, {
  styles,
  hocs: [
    withMulti({
      collection: Posts,
      fragmentName: 'PostsList',
      enableTotal: true,
      ssr: true,
    }),
    withTimezone,
  ]
});

declare global {
  interface ComponentTypes {
    PostsTimeBlock: typeof PostsTimeBlockComponent
  }
}
