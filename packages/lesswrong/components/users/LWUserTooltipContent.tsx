import React from 'react';
import { userGetCommentCount, userGetPostCount } from '../../lib/collections/users/helpers';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { truncate } from '../../lib/editor/ellipsize';
import DescriptionIcon from '@material-ui/icons/Description';
import MessageIcon from '@material-ui/icons/Message';
import TagIcon from '@material-ui/icons/LocalOffer';
import { BookIcon } from '../icons/bookIcon'
import classNames from 'classnames';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  tooltip: {
    maxWidth: 250,
  },
  joined: {
    ...theme.typography.italic,
    marginBottom: theme.spacing.unit,
  },
  bookIcon: {
    filter: "invert(100%)",
  },
  bio: {
    marginTop: theme.spacing.unit,
    lineHeight: "1.3rem",
  },
  icon: {
    height: "1rem",
    width: "1rem",
    position: "relative",
    top: 2,
    color: theme.palette.icon.tooltipUserMetric,
  },
});

export const LWUserTooltipContent = ({classes, user}: {
  classes: ClassesType,
  user: UsersMinimumInfo,
}) => {

  const { FormatDate } = Components

  const { htmlBio } = user

  const truncatedBio = truncate(htmlBio, 500)
  const postCount = userGetPostCount(user)
  const commentCount = userGetCommentCount(user)
  const wikiContributionCount = user.tagRevisionCount
  const sequenceCount = user.sequenceCount; // TODO: Counts LW sequences on Alignment Forum

  return <span>
    <div className={classes.joined}>Joined on <FormatDate date={user.createdAt} format="MMM Do YYYY" /></div>
    { !!sequenceCount && <div>
        <BookIcon className={classNames(classes.icon, classes.bookIcon)}/> { sequenceCount } sequence{sequenceCount !== 1 && 's'}
      </div>}
    { !!postCount && <div><DescriptionIcon className={classes.icon} /> { postCount } post{postCount !== 1 && 's'}</div>}
    { !!commentCount && <div><MessageIcon className={classes.icon}  /> { commentCount } comment{commentCount !== 1 && 's'}</div>}
    { !!wikiContributionCount && <div><TagIcon className={classes.icon}  /> { wikiContributionCount } {taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} contribution{wikiContributionCount !== 1 && 's'}</div>}
    { truncatedBio && <div className={classes.bio } dangerouslySetInnerHTML={{__html: truncatedBio}}/>}
  </span>
}

const LWUserTooltipContentComponent = registerComponent(
  'LWUserTooltipContent',
  LWUserTooltipContent,
  {styles},
);

declare global {
  interface ComponentTypes {
    LWUserTooltipContent: typeof LWUserTooltipContentComponent
  }
}
