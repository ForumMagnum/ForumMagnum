import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { namesAttachedReactionsByName, defaultFilter } from '../../lib/voting/reactions';

const styles = (theme: ThemeType): JssStyles => ({
  reactionSvg: {
    width: 18,
    height: 18,
    verticalAlign: "middle",
  },
  inverted: {
    color: theme.palette.icon.inverted
  },
})

const ReactionIcon = ({react, inverted=false, classes}: {
  react: string,
  inverted?: boolean,
  classes: ClassesType
}) => {
  const reactionType = namesAttachedReactionsByName[react];
  const opacity = reactionType.filter?.opacity ?? defaultFilter.opacity;
  const saturation = reactionType.filter?.saturate ?? defaultFilter.saturate;
  const padding = reactionType.filter?.padding ? `${reactionType.filter.padding}px` : undefined;

  return <img
    src={reactionType.svg}
    style={{
      filter: inverted
        ? `opacity(${opacity}) saturate(${saturation}) invert(1)`
        : `opacity(${opacity}) saturate(${saturation})`,
      padding,
    }}
    className={classes.reactionSvg}
  />;
}


const ReactionIconComponent = registerComponent('ReactionIcon', ReactionIcon, {styles});

declare global {
  interface ComponentTypes {
    ReactionIcon: typeof ReactionIconComponent
  }
}

