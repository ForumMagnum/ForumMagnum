import React, { useEffect, useMemo, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';
import { lightbulbIcon } from '../icons/lightbulbIcon';
import { randInt } from '../../lib/random';
import { gql, useQuery } from '@apollo/client';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 1400,
    margin: '10px auto'
  },
  topSection: {
    paddingLeft: 12,
    marginBottom: 10
  },
  filters: {
    display: 'flex',
    alignItems: 'flex-end',
    columnGap: 10,
    marginBottom: 10
  },
  filter: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '4px',
  },
  filterLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    paddingLeft: 12
  },
  checkIcon: {
    width: 20,
    marginRight: 8,
  },
  tagFilter: {
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.text.primaryAlert,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: theme.borderRadius.small,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
  closeIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  resetFilters: {
    flex: '1 1 0',
    textAlign: 'right'
  },
  resetFiltersBtn: {
    background: 'none',
    color: theme.palette.grey[800],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '18px',
    '&:hover': {
      color: theme.palette.grey[1000],
    }
  },
  table: {
    background: theme.palette.grey[0],
    width: '100%',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '18px',
    textAlign: 'left',
    borderCollapse: 'collapse',
    '& th,td': {
      minWidth: 72,
      padding: 5,
      '&:first-child': {
        padding: '5px 5px 5px 14px'
      },
      '&:last-child': {
        padding: '5px 14px 5px 5px'
      }
    }
  },
  centeredColHeader: {
    textAlign: 'center',
  },
  row: {
    borderTop: theme.palette.border.extraFaint,
  },
  inCol: {
    textAlign: 'center'
  },
  emailIcon: {
    color: theme.palette.grey[400],
    fontSize: 20,
  },
  forumIcon: {
    color: theme.palette.grey[400],
    '& svg': {
      height: 26
    }
  },
  yesIcon: {
    color: theme.palette.icon.greenCheckmark,
  },
  link: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.dark,
      opacity: 1
    }
  },
  title: {
    fontWeight: '600'
  },
  author: {
    color: theme.palette.grey[900],
    fontSize: 13,
    marginLeft: 6
  },
  postIcons: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 12,
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  karma: {
    width: 62
  },
  linkIcon: {
    fontSize: 12,
  },
  questionIcon: {
    fontWeight: 600
  },
  curatedIcon: {
    color: theme.palette.icon.yellow,
    fontSize: 12,
  },
  tagsCol: {
    fontSize: 12,
  },
  tag: {
    maxWidth: 200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[600],
    }
  },
  commentIcon: {
    position: 'relative',
    top: 3,
    fontSize: 16,
    marginRight: 7
  },
  suggestedCurationCol: {
    fontSize: 12,
  },
  upvotesCol: {
    textAlign: 'center',
    color: theme.palette.text.charsAdded
  },
  downvotesCol: {
    textAlign: 'center',
    color: theme.palette.text.charsRemoved
  },
  commentsCol: {
    textAlign: 'center',
  },
  hiddenIcon: {
    visibility: 'hidden'
  }
})

export type VoteCounts = {
  postId: string,
  upvoteCount: number,
  downvoteCount: number
}
type InDigest = "yes"|"maybe"|"no"
type TagUsage = {
  _id: string,
  name: string,
  core: boolean,
  count: number
}

const EditDigest = ({classes}:{classes: ClassesType}) => {
  const {results, loading, error} = useMulti({
    terms: {
      view: "timeframe",
      after: '2023-05-31',
      karmaThreshold: 2,
      excludeEvents: true
    },
    collectionName: "Posts",
    fragmentName: 'PostsListBase',
    limit: 200
  })
  
  const { data: voteCounts } = useQuery(gql`
    query getDigestPlannerVotes($postIds: [String]) {
      DigestPlannerVotes(postIds: $postIds) {
        postId
        upvoteCount
        downvoteCount
      }
    }`, {
      ssr: true,
      fetchPolicy: "cache-and-network",
      skip: !results,
      variables: {postIds: results?.map(post => post._id)},
    }
  )
  
  const [votes, setVotes] = useState<Record<string,Record<string,number>>>()
  useEffect(() => {
    if (!results || !voteCounts) return
    
    const newVotes: Record<string,Record<string,number>> = {}
    results.forEach(post => {
      // newVotes[post._id] = {upvotes: randInt(40), downvotes: randInt(40)}
      const counts = voteCounts.DigestPlannerVotes.find((vc: VoteCounts) => vc.postId === post._id) ?? {upvoteCount: 0, downvoteCount: 0}
      newVotes[post._id] = {upvotes: counts.upvoteCount, downvotes: counts.downvoteCount}
    })
    setVotes(newVotes)
  }, [results, voteCounts])
  
  const [emailDigestFilter, setEmailDigestFilter] = useState<InDigest[]>(["yes","maybe","no"])
  const [onsiteDigestFilter, setOnsiteDigestFilter] = useState<InDigest[]>(["yes","maybe","no"])
  const [tagFilter, setTagFilter] = useState<string>('')
  
  const handleUpdateEmailDigestFilter = (val: InDigest) => {
    if (emailDigestFilter.includes(val)) {
      setEmailDigestFilter(emailDigestFilter.filter(v => v !== val))
    } else {
      emailDigestFilter.push(val)
      setEmailDigestFilter(emailDigestFilter)
    }
  }
  
  const handleUpdateOnsiteDigestFilter = (val: InDigest) => {
    if (onsiteDigestFilter.includes(val)) {
      setOnsiteDigestFilter(onsiteDigestFilter.filter(v => v !== val))
    } else {
      onsiteDigestFilter.push(val)
      setOnsiteDigestFilter(onsiteDigestFilter)
    }
  }
  
  const resetFilters = () => {
    setEmailDigestFilter(["yes","maybe","no"])
    setOnsiteDigestFilter(["yes","maybe","no"])
    setTagFilter('')
  }

  const { SectionTitle, ForumDropdown, ForumDropdownMultiselect, ForumIcon } = Components
  
  const tagCounts = useMemo(() => results?.reduce((tagsList: TagUsage[], post: PostsListBase) => {
    post.tags.forEach(tag => {
      const prevTagData = tagsList.find(t => t._id === tag._id)
      if (prevTagData) {
        prevTagData.count += 1
      } else {
        tagsList.push({
          _id: tag._id,
          name: tag.name,
          core: tag.core,
          count: 1
        })
      }
    })
    return tagsList
  }, []).sort((a,b) => b.count - a.count), [results])
  
  if (!results || !votes || !tagCounts) {
    return null
  }
  
  const coreAndPopularTags = tagCounts.filter(tag => tag.core || tag.count > 3)
  const coreAndPopularTagIds = coreAndPopularTags.map(tag => tag._id)
  
  // initially sort by curated, then upvotes, then downvotes
  let posts = [...results].sort((a,b) => {
    if (a.curatedDate && !b.curatedDate) return -1
    if (!a.curatedDate && b.curatedDate) return 1
    
    if (!votes[a._id] || !votes[b._id]) return 0
    const upvoteDiff = votes[b._id].upvotes - votes[a._id].upvotes
    if (upvoteDiff === 0) return votes[a._id].downvotes - votes[b._id].downvotes
    return upvoteDiff
  })
  if (tagFilter) {
    posts = posts.filter(post => post.tags.find(tag => tag._id === tagFilter))
  }
  posts = posts.filter(post => {
    const passesEmailFilter = () => {
      if (emailDigestFilter.includes('yes') && post.baseScore > 100) {
        return true
      }
      if (emailDigestFilter.includes('maybe') && post.baseScore <= 100 && post.baseScore > 30) {
        return true
      }
      if (emailDigestFilter.includes('no') && post.baseScore <= 30) {
        return true
      }
      return false
    }
    const passesOnsiteFilter = () => {
      if (onsiteDigestFilter.includes('yes') && post.baseScore > 30) {
        return true
      }
      if (onsiteDigestFilter.includes('maybe') && post.baseScore <= 30 && post.baseScore > 10) {
        return true
      }
      if (onsiteDigestFilter.includes('no') && post.baseScore <= 10) {
        return true
      }
      return false
    }
    return passesEmailFilter() && passesOnsiteFilter()
  })
  
  const emailCount = posts.filter(p => p.baseScore > 100).length
  const onSiteCount = posts.filter(p => p.baseScore > 30).length
  const emailDigestOptions = {
    'yes': {label: `Yes (${emailCount})`},
    'maybe': {label: `Maybe (${posts.filter(p => p.baseScore <= 100 && p.baseScore > 30).length})`},
    'no': {label: `No (${posts.filter(p => p.baseScore <= 30).length})`}
  }
  const onsiteDigestOptions = {
    'yes': {label: `Yes (${onSiteCount})`},
    'maybe': {label: `Maybe (${posts.filter(p => p.baseScore <= 30 && p.baseScore > 10).length})`},
    'no': {label: `No (${posts.filter(p => p.baseScore <= 10).length})`}
  }
  
  const tagOptions = coreAndPopularTags.reduce((prev: Record<string, SettingsOption>, next) => {
    prev[next._id] = {label: `${next.name} (${posts.filter(p => p.tags.some(t => t._id === next._id)).length})`}
    return prev
  }, {'': {label: `All posts (${posts.length})`}})

  return (
    <div className={classes.root}>
      <div className={classes.topSection}>
        <SectionTitle title="Forum Digest (May 31 - Jun 7)" noTopMargin />
      </div>
      
      <div className={classes.filters}>
        <div className={classes.filter}>
          <label className={classes.filterLabel}>In email digest?</label>
          <ForumDropdownMultiselect values={emailDigestFilter} options={emailDigestOptions} onSelect={handleUpdateEmailDigestFilter} />
        </div>
        <div className={classes.filter}>
          <label className={classes.filterLabel}>In on-site digest?</label>
          <ForumDropdownMultiselect values={onsiteDigestFilter} options={onsiteDigestOptions} onSelect={handleUpdateOnsiteDigestFilter} />
        </div>
        <div className={classes.filter}>
          <label className={classes.filterLabel}>Filter by tag</label>
          <ForumDropdown value={tagFilter} options={tagOptions} onSelect={setTagFilter} />
        </div>
        <div className={classes.resetFilters}>
          <button type="button" className={classes.resetFiltersBtn} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>
      
      <table className={classes.table}>
        <thead>
          <tr className={classes.headerRow}>
            <th className={classes.centeredColHeader}>
              Email?<div>({emailCount})</div>
            </th>
            <th className={classes.centeredColHeader}>
              On-site?<div>({onSiteCount})</div>
            </th>
            <th>Post</th>
            <th>Tags</th>
            <th>Suggested curation</th>
            <th className={classes.centeredColHeader}>Upvotes</th>
            <th className={classes.centeredColHeader}>Downvotes</th>
            <th className={classes.centeredColHeader}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => {
            const visibleTags = post.tags.filter(tag => coreAndPopularTagIds.includes(tag._id))
            const hiddenTagsCount = post.tags.length - visibleTags.length
            const showMoreTags = hiddenTagsCount ? <div className={classes.link}>{hiddenTagsCount} more</div> : null
            
            return <tr key={post._id} className={classes.row}>
              <td className={classes.inCol}>
                {post.baseScore > 30 && <ForumIcon
                  icon="Email"
                  className={classNames(classes.emailIcon, {[classes.yesIcon]: post.baseScore > 100})}
                />}
              </td>
              <td className={classes.inCol}>
                {post.baseScore > 10 && <div className={classNames(classes.forumIcon, {[classes.yesIcon]: post.baseScore > 30})}>{lightbulbIcon}</div>}
              </td>
              <td>
                <div>
                  <a href={`/posts/${post._id}/${post.slug}`} target="_blank" className={classNames(classes.title, classes.link)}>
                    {post.title}
                  </a>
                  <span className={classes.author}>({post.user?.displayName}, {post.readTimeMinutes} min)</span>
                </div>
                <div className={classes.postIcons}>
                  <div className={classes.karma}>{post.baseScore} karma</div>
                  <ForumIcon icon="Link" className={classNames(classes.linkIcon, {[classes.hiddenIcon]: !post.url})} />
                  <div className={classNames(classes.questionIcon, {[classes.hiddenIcon]: !post.question})}>Q</div>
                  <ForumIcon icon="Star" className={classNames(classes.curatedIcon, {[classes.hiddenIcon]: !post.curatedDate})} />
                </div>
              </td>
              <td className={classes.tagsCol}>
                {visibleTags.sort((a,b) => {
                  if (a.core && !b.core) return -1
                  if (!a.core && b.core) return 1
                  return 0
                }).map(tag => {
                  return <div key={tag._id} className={classes.tag} onClick={() => setTagFilter(tag._id)}>{tag.name}</div>
                })}
                {showMoreTags}
              </td>
              <td className={classes.suggestedCurationCol}>
                {post.suggestForCuratedUsernames}
              </td>
              <td className={classes.upvotesCol}>{votes[post._id]?.upvotes ?? null}</td>
              <td className={classes.downvotesCol}>{votes[post._id]?.downvotes ?? null}</td>
              <td className={classes.commentsCol}>
                {post.commentCount && <a href={`/posts/${post._id}/${post.slug}#comments`} target="_blank" className={classes.link}>
                  <ForumIcon icon="Comment" className={classes.commentIcon} />
                  {post.commentCount}
                </a>}
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}

const EditDigestComponent = registerComponent('EditDigest', EditDigest, {styles});

declare global {
  interface ComponentTypes {
    EditDigest: typeof EditDigestComponent
  }
}
