import React from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
  isLW,
} from "../../../lib/instanceSettings";
import { compassIcon } from "../../icons/compassIcon";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { isFriendlyUI } from "../../../themes/forumTheme";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { combineUrls } from "../../../lib/vulcan-lib/utils";
import { LWTooltip } from "../../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    display: "inline-block",
  },
  icon: {
    color: theme.palette.text.dim3,
    display: "inline-block",
    width: 20,
    marginLeft: isFriendlyUI ? undefined : -6,
    verticalAlign: "sub",
  },
});

const CrosspostHeaderIconInner = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList,
  classes: ClassesType<typeof styles>,
}) => {
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

export const CrosspostHeaderIcon = registerComponent(
  "CrosspostHeaderIcon", CrosspostHeaderIconInner, {styles}
);


