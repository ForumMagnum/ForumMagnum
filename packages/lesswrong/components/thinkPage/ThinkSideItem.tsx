// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { Link } from '@/lib/reactRouterWrapper';
import { getThinkUrl } from './ThinkLink';

export const thinkSideItemStyles = (theme: ThemeType) => ({  
  root: {
    paddingTop: 6,
    paddingBottom: 6,
    ...theme.typography.body2,
    width: 250,
    display: 'flex',
    alignItems: 'center',
    opacity: 0.75,
    transition: 'opacity 0.2s ease-in-out',
    '&:hover': {
      opacity: 1
    },
    '&:hover $date': {
      opacity: 1
    }
  },
  icon: {
    width: 12,
    height: 12,
    color: theme.palette.grey[600],
    marginRight: 10
  },
  title: {
    flex: 1,
    textWrap: 'balance',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxHeight: '3rem'
  },
  date: {
    marginLeft: 10,
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    fontSize: '0.9rem',
    opacity: 0
  }
});

const styles = thinkSideItemStyles 

export const ThinkSideItem = ({post, classes}: {
  post: PostsListWithVotes,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  
  const { ForumIcon, FormatDate } = Components

  const icon = post.draft ? <ForumIcon icon="Pencil" className={classes.icon}/> : <ForumIcon icon="Document" className={classes.icon}/>
  
  const date = post.modifiedAt > (post.lastVisitedAt ?? post.createdAt) ? post.modifiedAt : post.lastVisitedAt ?? post.createdAt

  return <Link className={classes.root} to={getThinkUrl(post)}>
    {icon} <div className={classes.title}>
      {post.title}
      <span className={classes.date}>
        <FormatDate date={date} />
      </span>
    </div>
  </Link>;
}

const ThinkSideItemComponent = registerComponent('ThinkSideItem', ThinkSideItem, {styles});

declare global {
  interface ComponentTypes {
    ThinkSideItem: typeof ThinkSideItemComponent
  }
}
