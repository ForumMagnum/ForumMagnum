import React from "react";
import TransformIcon from '@material-ui/icons/Transform';
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
    fontSize: 18,
    margin: "0 9px 0 -6px",
    transform: "translateY(4px)",
  },
});

const CrosspostNotice = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const {LWTooltip} = Components;

  const tip = post.fmCrosspost.hostedHere
    ? `This post was crossposted to ${fmCrosspostSiteNameSetting.get()}. Click to view.`
    : `This is a crosspost. Click to view the original on ${fmCrosspostSiteNameSetting.get()}.`;
  const href = `${fmCrosspostBaseUrlSetting.get()}posts/${post.fmCrosspost.foreignPostId}`;

  return (
    <div className={classes.root}>
      <a href={href} target="_blank" rel="noreferrer">
        <LWTooltip title={tip}>
          <TransformIcon fontSize="inherit" />
        </LWTooltip>
      </a>
    </div>
  );
}

const CrosspostNoticeComponent = registerComponent(
  "CrosspostNotice", CrosspostNotice, {styles}
);

declare global {
  interface ComponentTypes {
    CrosspostNotice: typeof CrosspostNoticeComponent,
  }
}
