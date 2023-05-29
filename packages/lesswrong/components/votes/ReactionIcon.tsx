import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { namesAttachedReactionsByName, defaultFilter } from '../../lib/voting/reactions';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  reactionSvg: {
    verticalAlign: "middle",
  },
  invertIfDarkMode: {
    filter: (theme.palette.type==="dark") ? "invert(1)" : undefined,
  },
  invertUnlessDarkMode: {
    filter: (theme.palette.type==="dark") ? undefined : "invert(1)"
  }
})

const ReactionIcon = ({react, inverted=false, size=18, classes}: {
  react: string,
  inverted?: boolean,
  size?: number,
  classes: ClassesType
}) => {
  const reactionType = namesAttachedReactionsByName(react);
  const opacity = reactionType.filter?.opacity ?? defaultFilter.opacity;
  const saturation = reactionType.filter?.saturate ?? defaultFilter.saturate;
  const padding = reactionType.filter?.padding ? `${reactionType.filter.padding}px` : undefined;

  return <span
    className={classNames(
      {
        [classes.invertIfDarkMode]: !inverted,
        [classes.invertUnlessDarkMode]: inverted,
      },
    )}
  >
    <img
      src={reactionType.svg}
      style={{
        filter: `opacity(${opacity}) saturate(${saturation})`,
        padding,
        width:size, height:size,
      }}
      className={classes.reactionSvg}
    />
  </span>
}


const ReactionIconComponent = registerComponent('ReactionIcon', ReactionIcon, {styles});

declare global {
  interface ComponentTypes {
    ReactionIcon: typeof ReactionIconComponent
  }
}

