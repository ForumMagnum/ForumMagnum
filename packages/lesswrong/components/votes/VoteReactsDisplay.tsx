import { registerComponent, Components } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import IconButton from '@material-ui/core/IconButton';
import React from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 16,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 12,
    display: "inline-block",
  },
  axis: {
    display: "inline-block",
    padding: 6,
    marginRight: 4,
    border: "1px solid #ddd",
  },
  axisScore: {
    display: "inline-block",
    marginRight: 6,
  },
  axisLabel: {
    display: "inline-block",
  },
  emoji: {
    display: "inline-block",
    padding: 6,
    marginRight: 4,
    border: "1px solid #ddd",
  },
});

const VoteReactsDisplay = ({document, classes}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    <div className={classes.axis}>
      <div className={classes.axisScore}>3</div>
      <div className={classes.axisLabel}>Truth</div>
    </div>
    <div className={classes.axis}>
      <div className={classes.axisScore}>1</div>
      <div className={classes.axisLabel}>Aim</div>
    </div>
    <div className={classes.axis}>
      <div className={classes.axisScore}>1</div>
      <div className={classes.axisLabel}>Clarity</div>
    </div>
    <div className={classes.axis}>
      <div className={classes.axisScore}>1</div>
      <div className={classes.axisLabel}>Seeking</div>
    </div>
    
    <div className={classes.emoji}>2 🎉</div>
    <div className={classes.emoji}>1 ❤️</div>
  </div>
};

const VoteReactsDisplayComponent = registerComponent('VoteReactsDisplay', VoteReactsDisplay, {styles});

declare global {
  interface ComponentTypes {
    VoteReactsDisplay: typeof VoteReactsDisplayComponent
  }
}
