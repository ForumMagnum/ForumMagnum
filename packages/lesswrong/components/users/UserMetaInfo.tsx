// TODO: Reconcile this file with user meta info the LW user profile page
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import TagIcon from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import classNames from 'classnames';
import ForumIcon from "../common/ForumIcon";
import FormatDate from "../common/FormatDate";

const styles = (theme: ThemeType) => ({
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
});

export const UserMetaInfo = ({
  user,
  hideAfKarma,
  hideWikiContribution,
  hidePostCount,
  hideCommentCount,
  omegaAlignment = "legacy",
  hideInfoOnSmallScreen,
  infoClassName,
  classes,
}: {
  user: UsersMinimumInfo,
  hideAfKarma?: boolean,
  hideWikiContribution?: boolean,
  hidePostCount?: boolean,
  hideCommentCount?: boolean,
  omegaAlignment?: "legacy" | "inline",
  hideInfoOnSmallScreen?: boolean,
  infoClassName?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { createdAt, karma, afKarma, postCount, commentCount, tagRevisionCount: wikiContributionCount } = user;

  const infoClasses = classNames(infoClassName, classes.info);

  return <div className={classes.root}>
      {(karma !== 0) && <div className={infoClasses}>
        <ForumIcon icon="Star" className={classes.icon} />
        <div>{karma}</div>
      </div>}
      {!hideAfKarma && afKarma > 0 && <div className={infoClasses}>
        <div className={classNames(classes.omegaIcon, omegaAlignment === "legacy" && classes.omegaIconLegacy)}>Ω</div>
        <div>{afKarma}</div>
      </div>}
      {!hidePostCount && (postCount > 0) && <div className={classNames(infoClasses, {[classes.hideOnSmallScreen]: hideInfoOnSmallScreen})}>
        <DescriptionIcon className={classes.icon} /> 
        {postCount}
      </div>}
      {!hideCommentCount && (commentCount > 0) && <div className={classNames(infoClasses, {[classes.hideOnSmallScreen]: hideInfoOnSmallScreen})}>
        <MessageIcon className={classes.icon} />
        {commentCount}
      </div>}
      {!hideWikiContribution && !!wikiContributionCount && <div className={infoClasses}>
        <TagIcon className={classes.icon}  /> 
        {wikiContributionCount}
      </div>}
      <div className={infoClasses}>
        <FormatDate date={createdAt}/>
      </div>
    </div>
}

export default registerComponent('UserMetaInfo', UserMetaInfo, {styles});



