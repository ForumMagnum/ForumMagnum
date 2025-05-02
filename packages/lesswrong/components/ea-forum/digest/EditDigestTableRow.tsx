import React, { useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import { useMessages } from '../../common/withMessages';
import { StatusField, getEmailDigestPostData, getPostAuthors } from '../../../lib/collections/digests/helpers';
import type { DigestPost, PostWithRating } from './EditDigest';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { isPostWithForeignId } from '../../hooks/useForeignCrosspost';

const styles = (theme: ThemeType) => ({
  row: {
    borderTop: theme.palette.border.faint,
  },
  statusCol: {
    textAlign: 'center',
    cursor: 'pointer'
  },
  statusColPending: {
    opacity: 0,
    '&:hover': {
      opacity: 0.2
    }
  },
  statusIcon: {
    display: 'inline-block',
    width: 30,
    height: 30,
    fontSize: 20,
    lineHeight: '27px',
  },
  yesIcon: {
    color: theme.palette.icon.greenCheckmark,
  },
  maybeIcon: {
    color: theme.palette.grey[400],
    fontWeight: '500',
  },
  noIcon: {
    color: theme.palette.text.negativeKarmaRed,
  },
  pendingIcon: {
    color: theme.palette.icon.greenCheckmark,
  },
  postTitleCol: {
    display: 'flex',
    columnGap: 10,
  },
  copyLink: {
    marginTop: 1
  },
  copyIcon: {
    color: theme.palette.primary.main,
    fontSize: 16,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  largeCopyIcon: {
    fontSize: 18
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
  isRead: {
    color: theme.palette.link.visited,
  },
  author: {
    color: theme.palette.grey[900],
    fontSize: 13,
  },
  postIcons: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 12,
    color: theme.palette.grey[600],
    fontSize: 12,
    '& .PostsItem2MetaInfo-metaInfo': {
      fontSize: 12,
      fontWeight: 400
    }
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
  voteCol: {
    textAlign: 'center',
    fontSize: 30
  },
  ratingCol: {
    textAlign: 'center',
    color: theme.palette.text.charsAdded
  },
  commentsCol: {
    textAlign: 'center',
  },
  hiddenIcon: {
    visibility: 'hidden'
  }
})

/**
 * Given a post with a currentUserVote, return the icon representing that vote.
 */
const voteToIcon = (post: PostsListWithVotes): React.ReactNode => {
  const { OverallVoteButton } = Components
  switch (post.currentUserVote) {
    case 'smallUpvote':
    case 'bigUpvote':
      return <OverallVoteButton enabled={false} upOrDown='Upvote' orientation='up' color='secondary' document={post} collectionName='Posts' />
    case 'smallDownvote':
    case 'bigDownvote':
      return <OverallVoteButton enabled={false} upOrDown='Downvote' orientation='down' color='error' document={post} collectionName='Posts' />
    default:
      return null
  }
}


const EditDigestTableRow = ({post, postStatus, statusIconsDisabled, handleClickStatusIcon, visibleTagIds, setTagFilter, votesVisible, classes}: {
  post: PostWithRating,
  postStatus: Partial<DigestPost>,
  statusIconsDisabled: boolean,
  handleClickStatusIcon: (postId: string, statusField: StatusField) => void,
  visibleTagIds: string[],
  setTagFilter: (tagId: string) => void,
  votesVisible: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const {flash} = useMessages()
  
  const voteIcon = useMemo(() => voteToIcon(post), [post])

  /**
   * Build the cell with the given status icon
   */
  const getStatusIconCell = (postId: string, statusField: StatusField, postStatus: Partial<DigestPost>) => {
    const status = postStatus[statusField]
    let iconNode = null
    switch (status) {
      case 'yes':
        iconNode = <CheckIcon />
        break
      case 'maybe':
        iconNode = <div>?</div>
        break
      case 'no':
        iconNode = <CloseIcon />
        break
      default:
        iconNode = <CheckIcon /> // this has opacity: 0, it's just here to appear on hover
        break
    }
    const onClickAttr = {onClick: () => handleClickStatusIcon(postId, statusField)}
    return <td
      className={classNames(classes.statusCol, {[classes.statusColPending]: status === 'pending'})}
      {...(!statusIconsDisabled && onClickAttr)}
    >
      <div
        className={classNames(classes.statusIcon, {
          [classes.yesIcon]: status === 'yes',
          [classes.maybeIcon]: status === 'maybe',
          [classes.pendingIcon]: status === 'pending',
          [classes.noIcon]: status === 'no',
        })}
      >
        {iconNode}
      </div>
    </td>
  }
  
  /**
   * Writes the post data to the clipboard, in the format that
   * we expect to see in the email digest
   */
  const copyPostToClipboard = async (post: PostsListWithVotes) => {
    await navigator.clipboard.write(
      [new ClipboardItem({
        'text/html': new Blob(
          [getEmailDigestPostData(post)],
          {type: 'text/html'}
        )
      })]
    )
    flash({messageString: "Post copied"})
  }
  
  const { ForumIcon, LWTooltip, PostsItemDate } = Components
  
  const readTime = isPostWithForeignId(post) ? '' : `, ${post.readTimeMinutes} min`
  const linkpostText = post.url ? ', link-post' : ''
  const visibleTags = post.tags.filter(tag => visibleTagIds.includes(tag._id))
  
  return <tr className={classes.row}>
    {getStatusIconCell(post._id, 'emailDigestStatus', postStatus)}
    {getStatusIconCell(post._id, 'onsiteDigestStatus', postStatus)}

    <td className={classes.postTitleCol}>
      <LWTooltip title="Click to copy post link" placement="bottom" className={classes.copyLink}>
        <ForumIcon icon="ClipboardDocument" className={classes.copyIcon} onClick={() => copyPostToClipboard(post)} />
      </LWTooltip>
      <div>
        <div>
          <a href={postGetPageUrl(post)} target="_blank" rel="noreferrer" className={classNames(
            classes.title,
            classes.link,
            {[classes.isRead]: post.isRead},
          )}>
            {post.title}
          </a> <span className={classes.author}>({getPostAuthors(post)}{readTime}{linkpostText})</span>
        </div>
        <div className={classes.postIcons}>
          <div className={classes.karma}>{post.baseScore} karma</div>
          <PostsItemDate post={post} noStyles includeAgo useCuratedDate={false} />
          <ForumIcon icon="Link" className={classNames(classes.linkIcon, {[classes.hiddenIcon]: !post.url})} />
          <div className={classNames(classes.questionIcon, {[classes.hiddenIcon]: !post.question})}>Q</div>
          <ForumIcon icon="Star" className={classNames(classes.curatedIcon, {[classes.hiddenIcon]: !post.curatedDate})} />
        </div>
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
    </td>

    <td className={classes.suggestedCurationCol}>
      {post.suggestForCuratedUsernames}
    </td>
    <td className={classes.voteCol}>
      {votesVisible && voteIcon}
    </td>
    {/* <td className={classes.ratingCol}>{post.rating}</td> */}
    <td className={classes.commentsCol}>
      {post.commentCount > 0 && <a href={`${postGetPageUrl(post)}#comments`} target="_blank" rel="noreferrer" className={classes.link}>
        <ForumIcon icon="Comment" className={classes.commentIcon} />
        {post.commentCount}
      </a>}
    </td>
  </tr>
}

const EditDigestTableRowComponent = registerComponent('EditDigestTableRow', EditDigestTableRow, {styles});

declare global {
  interface ComponentTypes {
    EditDigestTableRow: typeof EditDigestTableRowComponent
  }
}
