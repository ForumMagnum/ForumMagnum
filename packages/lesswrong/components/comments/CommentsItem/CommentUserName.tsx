import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import moment from 'moment';
import { siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { DatabasePublicSetting } from '../../../lib/publicSettings';

const newUserIconKarmaThresholdSetting = new DatabasePublicSetting<number|null>('newUserIconKarmaThreshold', null)

const styles = (theme: ThemeType): JssStyles => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
  sproutTooltip: {
    marginLeft: -4,
    marginRight: 10,
  },
  sproutTooltipTitle: {
    maxWidth: 200,
  },
  authorIcon: {
    verticalAlign: 'text-bottom',
    color: theme.palette.grey[500],
    // color: '#76a0a7',
    // color: '#a66ea3',
    fontSize: 16,
  },
  sproutIcon: {
    position: 'relative',
    bottom: -2,
    color: theme.palette.icon.sprout,
    fontSize: 16,
  }
});

const CommentUserName = ({comment, classes, simple = false, isPostAuthor, hideSprout, className}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
  isPostAuthor?: boolean,
  hideSprout?: boolean,
  className?: string
}) => {
  const { UserNameDeleted, UsersName, ForumIcon, LWTooltip } = Components
  const author = comment.user
  
  if (comment.deleted) {
    return <span className={className}>[comment deleted]</span>
  } else if (comment.hideAuthor || !author) {
    return <span className={className}>
      <UserNameDeleted/>
    </span>
  } else if (comment.answer) {
    return (
      <span className={classNames(className, classes.authorAnswer)}>
        Answer by <UsersName user={author} simple={simple}/>
      </span>
    );
  } else {
    const karmaThreshold = newUserIconKarmaThresholdSetting.get()
    // show the "new user" sprout icon if the author has low karma or joined less than a week ago
    const showSproutIcon = (karmaThreshold && author.karma < karmaThreshold) ||
                            moment(author.createdAt).isAfter(moment().subtract(1, 'week'))
    return <>
      <UsersName
        user={author}
        simple={simple}
        className={classNames(className, classes.author)}
        tooltipPlacement="bottom-start"
      />
      {isPostAuthor && <LWTooltip
          placement="bottom-start"
          title="Post author"
          className={classes.sproutTooltip}
        >
          <ForumIcon icon="Author" className={classes.authorIcon} />
        </LWTooltip>
      }
      {showSproutIcon && !hideSprout && <LWTooltip
          placement="bottom-start"
          title={`${author.displayName} is new on ${siteNameWithArticleSetting.get()}. Take care in replying.`}
          className={classes.sproutTooltip}
          titleClassName={classes.sproutTooltipTitle}
        >
          <ForumIcon icon="Sprout" className={classes.sproutIcon} />
        </LWTooltip>
      }
    </>
  }
}

const CommentUserNameComponent = registerComponent('CommentUserName', CommentUserName, {
  styles,
  stylePriority: 100, //Higher than UsersName, which gets a className from us
});

declare global {
  interface ComponentTypes {
    CommentUserName: typeof CommentUserNameComponent
  }
}
