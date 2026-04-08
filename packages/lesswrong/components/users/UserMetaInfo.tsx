// TODO: Reconcile this file with user meta info the LW user profile page
import React from 'react';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import TagIcon from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import classNames from 'classnames';
import ForumIcon from "../common/ForumIcon";
import FormatDate from "../common/FormatDate";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { TooltipSpan } from '../common/FMTooltip';

const styles = defineStyles('UserMetaInfo', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  icon: {
    height: "1rem",
    width: "1rem",
    position: "relative",
  },
  omegaIcon: {
    fontWeight: 600,
    height: "1rem",
    width: "1rem",
    position: "relative",
    fontFamily: ['Palatino',
      '"Palatino Linotype"',
      '"Palatino LT STD"',
      '"Book Antiqua"',
      'Georgia',
      'serif'].join(','),
  },
  omegaIconLegacy: {
    marginTop: -4,
  },
  info: {
    display: "flex",
    alignItems: "center",
    marginRight: 8,
    fontSize: "1.1rem",
    textWrap: "nowrap",
    ...theme.typography.commentStyle,
  },
  hideOnSmallScreen: {
    ['@media (max-width: 500px)']: {
      display: "none",
    }
  }
}));

export const UserMetaInfo = ({user, hideAfKarma, hideWikiContribution, hidePostCount, hideCommentCount, omegaAlignment = "legacy", hideInfoOnSmallScreen, infoClassName, voteReceivedCount}: {
  user: UsersMinimumInfo,
  hideAfKarma?: boolean,
  hideWikiContribution?: boolean,
  hidePostCount?: boolean,
  hideCommentCount?: boolean,
  omegaAlignment?: "legacy" | "inline",
  hideInfoOnSmallScreen?: boolean,
  infoClassName?: string,
  voteReceivedCount?: number,
}) => {
  const classes = useStyles(styles);
  const { createdAt, karma, afKarma, postCount, commentCount, tagRevisionCount: wikiContributionCount } = user;

  const infoClasses = classNames(infoClassName, classes.info);

  const karmaTooltip = voteReceivedCount != null
    ? `${karma} karma (${Math.round(voteReceivedCount)} votes)`
    : `${karma} karma`;

  return <div className={classes.root}>
      {(karma !== 0) && <TooltipSpan title={karmaTooltip}>
        <div className={infoClasses}>
          <ForumIcon icon="Star" className={classes.icon} />
          <div>{karma}</div>
        </div>
      </TooltipSpan>}
      {!hideAfKarma && afKarma > 0 && <TooltipSpan title={`${afKarma} alignment karma`}>
        <div className={infoClasses}>
          <div className={classNames(classes.omegaIcon, omegaAlignment === "legacy" && classes.omegaIconLegacy)}>Ω</div>
          <div>{afKarma}</div>
        </div>
      </TooltipSpan>}
      {!hidePostCount && (postCount > 0) && <TooltipSpan title={`${postCount} posts`}>
        <div className={classNames(infoClasses, {[classes.hideOnSmallScreen]: hideInfoOnSmallScreen})}>
          <DescriptionIcon className={classes.icon} />
          {postCount}
        </div>
      </TooltipSpan>}
      {!hideCommentCount && (commentCount > 0) && <TooltipSpan title={`${commentCount} comments`}>
        <div className={classNames(infoClasses, {[classes.hideOnSmallScreen]: hideInfoOnSmallScreen})}>
          <MessageIcon className={classes.icon} />
          {commentCount}
        </div>
      </TooltipSpan>}
      {!hideWikiContribution && !!wikiContributionCount && <TooltipSpan title={`${wikiContributionCount} wiki edits`}>
        <div className={infoClasses}>
          <TagIcon className={classes.icon}  />
          {wikiContributionCount}
        </div>
      </TooltipSpan>}
      <div className={infoClasses}>
        <FormatDate date={createdAt}/>
      </div>
    </div>
}

export default UserMetaInfo;
