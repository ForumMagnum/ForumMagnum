import React, { useState, useCallback, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import moment from 'moment-timezone';
import { timeframeToTimeBlock, TimeframeType } from './timeframeUtils'
import { QueryLink } from '../../lib/reactRouterWrapper';
import type { ContentTypeString } from './PostsPage/ContentType';
import filter from 'lodash/filter';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  timeBlockTitle: {
    whiteSpace: "pre",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
    position: "sticky",
    zIndex: 1,
    ...(isFriendlyUI
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
        fontWeight: 600,
        fontSize: 18,
        color: theme.palette.grey[1000],
        marginTop: 25,
      }
      : {
        paddingTop: 4,
        paddingBottom: 4,
      }),
  },
  smallScreenTitle: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  largeScreenTitle: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
  },
  loadMore: {
    marginTop: 6,
  },
  noPosts: {
    marginLeft: isFriendlyUI ? 0 : 23,
    color: theme.palette.text.dim,
    ...(isFriendlyUI
      ? {
        marginTop: 18,
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {}),
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
    marginBottom: isFriendlyUI ? 8 : 0,
  },
  subtitle: isFriendlyUI ? {
    marginTop: 12,
  } : {},
  frontpageSubtitle: {
    marginBottom: 6
  },
  otherSubtitle: {
    marginTop: isFriendlyUI ? 0 : 6,
    marginBottom: 6
  },
  divider: {
    ...(isFriendlyUI && {
      display: 'none'
    }),
  }
})

interface PostTypeOptions {
  name: ContentTypeString
  postIsType: (post: PostsBase) => boolean
  label: string
}

const postTypes: PostTypeOptions[] = [
  {name: 'frontpage', postIsType: (post: PostsBase) => !!post.frontpageDate, label: 'Frontpage Posts'},
  {name: 'personal', postIsType: (post: PostsBase) => !post.frontpageDate, label: 'Personal Blogposts'}
]

export type PostsTimeBlockShortformOption = "all" | "none" | "frontpage";

const PostsTimeBlockInner = ({
  terms,
  timeBlockLoadComplete,
  dateForTitle,
  getTitle,
  before,
  after,
  hideIfEmpty,
  timeframe,
  shortform = "all",
  classes,
  includeTags=true,
}: {
  terms: PostsViewTerms,
  timeBlockLoadComplete: () => void,
  dateForTitle: moment.Moment,
  getTitle: (size: 'xsDown'|'smUp'|null) => string,
  before: moment.Moment,
  after: moment.Moment,
  hideIfEmpty: boolean,
  timeframe: TimeframeType,
  shortform?: PostsTimeBlockShortformOption,
  classes: ClassesType<typeof styles>,
  includeTags?: boolean,
}) => {
  const [noShortform, setNoShortform] = useState(false);
  const [noTags, setNoTags] = useState(false);

  const [tagFilter, setTagFilter] = useState<string|null>(null)
  const {query} = useLocation()
  const displayPostsTagsList = query.limit
  const timeBlock = timeframeToTimeBlock[timeframe];

  const { results: posts, totalCount, loading, loadMoreProps } = useMulti({
    terms: {
      ...terms,
      before: before.toDate(),
      after: after.toDate(),
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    enableTotal: true,
    itemsPerPage: 50,
  });

  const filteredPosts = tagFilter ? filter(posts, post => post.tags.map(tag=>tag._id).includes(tagFilter)) : posts

  const handleTagFilter = (tagId: string) => {
    if (tagFilter === tagId) { 
      setTagFilter(null)
    } else {
      setTagFilter(tagId)
    }
  }

  useEffect(() => {
    if (!loading && timeBlockLoadComplete) {
      timeBlockLoadComplete();
    }
  // No dependency list because we want this to be called even when it looks
  // like nothing has changed, to signal loading is complete
  });

  // Child component needs a way to tell us about the presence of shortforms
  const reportEmptyShortform = useCallback(() => {
    setNoShortform(true);
  }, []);
  const reportEmptyTags = useCallback(() => {
    setNoTags(true);
  }, []);

  const {
    PostsItem, LoadMore, ShortformTimeBlock, TagEditsTimeBlock, ContentType,
    Divider, Typography, PostsTagsList, PostsLoading,
  } = Components;

  const noPosts = !loading && (!filteredPosts || (filteredPosts.length === 0));
  // The most recent timeBlock is hidden if there are no posts or shortforms
  // on it, to avoid having an awkward empty partial timeBlock when it's close
  // to midnight.
  if (noPosts && noShortform && noTags && hideIfEmpty) {
    return null;
  }

  const postGroups = postTypes.map(type => ({
    ...type,
    filteredPosts: filteredPosts?.filter(type.postIsType) || []
  }));
  
  return (
    <div className={classes.root}>
      <QueryLink merge rel="nofollow" query={{
        after: after.format("YYYY-MM-DD"), 
        before: moment(before).add(1, 'd').format("YYYY-MM-DD"),
        limit: 100
      }}>
        <Typography variant="headline" className={classes.timeBlockTitle}>
          {['yearly', 'monthly'].includes(timeframe) && <div>
            {getTitle(null)}
          </div>}
          {['weekly', 'daily'].includes(timeframe) && <div>
            <div className={classes.smallScreenTitle}>
              {getTitle('xsDown')}
            </div>
            <div className={classes.largeScreenTitle}>
              {getTitle('smUp')}
            </div>
          </div>}
        </Typography>
      </QueryLink>

      <div>
        { noPosts && <div className={classes.noPosts}>
          No posts for {
          timeframe === 'daily'
            ? dateForTitle.format('MMMM Do YYYY')
              // Should be pretty rare. Basically people running off the end of
              // the Forum history on yearly
            : `this ${timeBlock}`
          }
        </div> }
        {displayPostsTagsList && <PostsTagsList posts={posts ?? null} currentFilter={tagFilter} handleFilter={handleTagFilter} expandedMinCount={0}/>}
        {postGroups.map(({name, filteredPosts, label}) => {
          if (filteredPosts?.length > 0 || (loading && isFriendlyUI)) {
            return <div key={name}>
              <div
                className={name === 'frontpage' ? classes.frontpageSubtitle : classes.otherSubtitle}
              >
                <ContentType type={name} label={label} className={classes.subtitle} />
              </div>
              <div className={classes.posts}>
                {!filteredPosts?.length && isFriendlyUI && <PostsLoading placeholderCount={10} />}
                {filteredPosts.map((post, i) =>
                  <PostsItem
                    key={post._id}
                    post={post}
                    index={i} dense
                    showBottomBorder={i < filteredPosts!.length -1}
                    useCuratedDate={false}
                  />
                )}
              </div>
            </div>
          }
        })}

        {(filteredPosts && filteredPosts.length < totalCount!) && <div className={classes.loadMore}>
          <LoadMore
            {...loadMoreProps}
          />
        </div>}

        {shortform !== "none" && <ShortformTimeBlock
          reportEmpty={reportEmptyShortform}
          before={before.toString()}
          after={after.toString()}
          terms={{
            view: "topShortform",
            shortformFrontpage: shortform === "frontpage" ? true : undefined,
          }}
        />}

        {timeframe==="daily" && includeTags && <TagEditsTimeBlock
          before={before.toString()}
          after={after.toString()}
          reportEmpty={reportEmptyTags}
        />}
      </div>
      {!loading && <div className={classes.divider}>
        <Divider wings={false} />
      </div>}
    </div>
  );
};

export const PostsTimeBlock = registerComponent('PostsTimeBlock', PostsTimeBlockInner, {
  styles,
});

declare global {
  interface ComponentTypes {
    PostsTimeBlock: typeof PostsTimeBlock
  }
}
