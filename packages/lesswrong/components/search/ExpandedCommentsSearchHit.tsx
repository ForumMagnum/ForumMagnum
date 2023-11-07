import {Components, registerComponent} from '../../lib/vulcan-lib'
import {Link} from '../../lib/reactRouterWrapper'
import React from 'react'
import type {Hit} from 'react-instantsearch-core'
import {Snippet} from 'react-instantsearch-dom'
import TagIcon from '@material-ui/icons/LocalOffer'
import {userGetProfileUrlFromSlug} from '../../lib/collections/users/helpers'
import {useNavigation} from '../../lib/routeUtil'
import {showKarmaSetting} from '../../lib/publicSettings.ts'
import {getCommentSearchHitUrl} from './CommentsSearchHit.tsx'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 18,
    cursor: 'pointer',
    backgroundColor: theme.palette.grey[100],
    borderRadius: 6,
    paddingBottom: "1.3em",
    '&:hover': {
      opacity: 0.5
    }
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.panelBackground.default,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottom: `1px solid ${theme.palette.grey[250]}`,
    padding: "1em 1.7rem",
  },
  link: {
    '&:hover': {
      opacity: 1
    }
  },
  authorRow: {
    display: "flex",
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 6,
    rowGap: '3px',
    color: theme.palette.grey[600],
    fontWeight: 500,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    marginTop: "1em",
    paddingLeft: "1.7rem",
  },
  metaInfo: {
    display: "flex",
    alignItems: 'center',
    columnGap: 3
  },
  tagIcon: {
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  snippetContainer: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '21px',
    color: theme.palette.text.normal,
    marginTop: "1em",
    paddingLeft: "1.7rem",
    paddingRight: "1.7rem",
  },
})

const ExpandedCommentsSearchHit = ({hit, showKarma = showKarmaSetting.get, classes}: {
  hit: Hit<any>,
  showKarma?: () => boolean,
  classes: ClassesType,
}) => {
  const { history } = useNavigation()

  const { FormatDate, UserNameDeleted } = Components
  const comment: AlgoliaComment = hit

  const url = getCommentSearchHitUrl(comment)  
  const handleClick = () => {
    history.push(url)
  }

  return <div className={classes.root} onClick={handleClick}>
    <Link to={url} className={classes.link} onClick={(e) => e.stopPropagation()}>
      {comment.postTitle && <div className={classes.title}>
        {comment.postTitle}
      </div>}
      {!comment.postTitle && comment.tagName && <div className={classes.title}>
        <TagIcon className={classes.tagIcon} />
        {comment.tagName}
      </div>}
      <div className={classes.snippetContainer}>
        <Snippet attribute="body" hit={comment} tagName="mark" />
      </div>
    </Link>
    <div className={classes.authorRow}>
      {comment.authorSlug ? <Link to={userGetProfileUrlFromSlug(comment.authorSlug)} onClick={(e) => e.stopPropagation()}>
        {comment.authorDisplayName}
      </Link> : <UserNameDeleted />}
      ·
      {showKarma() && <span>{comment.baseScore ?? 0} karma</span>}
      <FormatDate date={comment.createdAt} />
    </div>
  </div>
}

const ExpandedCommentsSearchHitComponent = registerComponent("ExpandedCommentsSearchHit", ExpandedCommentsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedCommentsSearchHit: typeof ExpandedCommentsSearchHitComponent
  }
}

