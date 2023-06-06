import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';
import { lightbulbIcon } from '../icons/lightbulbIcon';
import { randInt } from '../../lib/random';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 1400,
    margin: '10px auto'
  },
  topSection: {
    paddingLeft: 12
  },
  filters: {
    display: 'flex',
    columnGap: 10,
    marginBottom: 10
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
    color: theme.palette.icon.greenCheckmark,
    fontSize: 20,
  },
  forumIcon: {
    color: theme.palette.icon.greenCheckmark,
    '& svg': {
      height: 26
    }
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

type Medium = "email"|"on-site"|"none"|"all"
type TagUsage = {
  _id: string,
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
  
  const [votes, setVotes] = useState<Record<string,Record<string,number>>>()
  useEffect(() => {
    if (!results) return
    
    const newVotes: Record<string,Record<string,number>> = {}
    results.forEach(post => {
      newVotes[post._id] = {upvotes: randInt(40), downvotes: randInt(40)}
    })
    setVotes(newVotes)
  }, [results])
  
  const [digestFilter, setDigestFilter] = useState<Medium>('all')
  const [tagFilter, setTagFilter] = useState<string|null>(null)

  const { SectionTitle, ForumDropdown, ForumIcon } = Components
  
  if (!results || !votes) {
    return null
  }
  
  const tagCounts = results.reduce((tagsList: TagUsage[], post: PostsListBase) => {
    post.tags.forEach(tag => {
      const prevTagData = tagsList.find(t => t._id === tag._id)
      if (prevTagData) {
        prevTagData.count += 1
      } else {
        tagsList.push({
          _id: tag._id,
          core: tag.core,
          count: 1
        })
      }
    })
    return tagsList
  }, [])
  
  const coreAndPopularTagIds = tagCounts.filter(tag => tag.core || tag.count > 3).map(tag => tag._id)
  
  // initially sort by curated, then upvotes, then downvotes
  let posts = [...results].sort((a,b) => {
    if (a.curatedDate && !b.curatedDate) return -1
    if (!a.curatedDate && b.curatedDate) return 1
    
    if (!votes[a._id] || !votes[b._id]) return 0
    const upvoteDiff = votes[b._id].upvotes - votes[a._id].upvotes
    if (upvoteDiff === 0) return votes[a._id].downvotes - votes[b._id].downvotes
    return upvoteDiff
  })
  let tagFilteredCount = results.length
  if (tagFilter) {
    posts = posts.filter(post => post.tags.find(tag => tag.name === tagFilter))
    tagFilteredCount = posts.length
  }
  if (digestFilter) {
    posts = posts.filter(post => {
      switch (digestFilter) {
        case 'email': return post.baseScore > 50
        case 'on-site': return post.baseScore > 20
        case 'none': return post.baseScore <= 20
        default: return true
      }
    })
  }
  
  const emailCount = results.filter(p => p.baseScore > 50).length
  const onSiteCount = results.filter(p => p.baseScore > 30).length
  const noneCount = results.filter(p => p.baseScore <= 30).length
  const digestOptions = {
    'all': {label: `All posts (${results.length})`},
    'email': {label: `Email digest (${emailCount})`},
    'on-site': {label: `On-site digest (${onSiteCount})`},
    'none': {label: `No digest (${noneCount})`}
  }

  return (
    <div className={classes.root}>
      <div className={classes.topSection}>
        <SectionTitle title="Forum Digest (May 31 - Jun 7)" noTopMargin />
        
        <div className={classes.filters}>
          <ForumDropdown value={digestFilter} options={digestOptions} onSelect={setDigestFilter} />
          {tagFilter && <div className={classes.tagFilter} onClick={() => setTagFilter(null)}>
            Tag: {tagFilter} ({tagFilteredCount})
            <ForumIcon icon="Close" className={classes.closeIcon} />
          </div>}
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
                {post.baseScore > 50 && <ForumIcon icon="Email" className={classes.emailIcon} />}
              </td>
              <td className={classes.inCol}>
                {post.baseScore > 20 && <div className={classes.forumIcon}>{lightbulbIcon}</div>}
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
                  return <div key={tag._id} className={classes.tag} onClick={() => setTagFilter(tag.name)}>{tag.name}</div>
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
