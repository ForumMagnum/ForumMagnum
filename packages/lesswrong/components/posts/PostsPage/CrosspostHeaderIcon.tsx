import React from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";
import { compassIcon } from "../../icons/compassIcon";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { combineUrls } from "../../../lib/vulcan-lib/utils";
import LWTooltip from "../../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useForumType } from '../../hooks/useForumType';

const styles = defineStyles("CrosspostHeaderIcon", (theme: ThemeType) => ({
  root: {
    display: "inline-block",
  },
  icon: {
    color: theme.palette.text.dim3,
    display: "inline-block",
    width: 20,
    marginLeft: -6,
    verticalAlign: "sub",
  },
}));

const CrosspostHeaderIcon = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList|PostsEdit,
}) => {
  const classes = useStyles(styles);
  const { isLW } = useForumType();

  if (!post.fmCrosspost) {
    return null;
  }
  const icon = isLW ? lightbulbIcon : compassIcon;
  const tip = post.fmCrosspost.hostedHere
    ? `This post was crossposted to ${fmCrosspostSiteNameSetting.get()}. Click to view.`
    : `This is a crosspost. Click to view the original on ${fmCrosspostSiteNameSetting.get()}.`;
  const href = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `posts/${post.fmCrosspost.foreignPostId}`);

  return (
    <div className={classes.root}>
      <a href={href} target="_blank" rel="noreferrer">
        <LWTooltip title={tip}>
          <span className={classes.icon}>{icon}</span>
        </LWTooltip>
      </a>
    </div>
  );
}

export default CrosspostHeaderIcon;


