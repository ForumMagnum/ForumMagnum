import { registerComponent, Components } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import IconButton from '@material-ui/core/IconButton';
import React from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16,
    fontFamily: theme.typography.commentStyle.fontFamily,
  },
  row: {
    padding: 4,
  },
  leftSide: {
    display: "inline-block",
    width: 130,
  },
  rightSide: {
    display: "inline-block",
    width: 130,
  },
  divider: {
    height: 12,
  },
  
  voteIconWrapper: {
    paddingLeft: 2,
    paddingRight: 5,
    display: "inline-block",
  },
  voteIcon: {
    padding: 0,
    "& .MuiSvgIcon-root": {
      fontSize: 12,
    },
  },
  downArrow: {
    transform: 'rotate(-180deg)',
  },
});

const UpvoteIcon = ({classes}: {classes: ClassesType}) => {
  return <div className={classes.voteIconWrapper}>
    <IconButton className={classes.voteIcon} disableRipple>
      <UpArrowIcon
        className={classes.smallArrow}
        color="primary" viewBox='6 6 12 12'
      />
    </IconButton>
  </div>
}

const DownvoteIcon = ({classes}: {classes: ClassesType}) => {
  return <div className={classes.voteIconWrapper}>
    <IconButton className={classNames(classes.voteIcon, classes.downArrow)} disableRipple>
      <UpArrowIcon
        className={classes.smallArrow}
        color="error" viewBox='6 6 12 12'
      />
    </IconButton>
  </div>
}

const VoteReactsForm = ({document, voteProps, collection, classes}: {
  document: CommentsList|PostsWithVotes|RevisionMetadataWithChangeMetrics
  voteProps: any,
  collection: any,
  classes: ClassesType,
}) => {
  return <Card>
    <div className={classes.root}>
      <div className={classes.row}>
        <div className={classes.leftSide}>
          <UpvoteIcon classes={classes}/>
          True
        </div>
        <div className={classes.rightSide}>
          <DownvoteIcon classes={classes} />
          False
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.leftSide}>
          <UpvoteIcon classes={classes}/>
          Hits the mark
        </div>
        <div className={classes.rightSide}>
          <DownvoteIcon classes={classes}/>
          Misses the point
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.leftSide}>
          <UpvoteIcon classes={classes}/>
          Clear
        </div>
        <div className={classes.rightSide}>
          <DownvoteIcon classes={classes}/>
          Muddled
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.leftSide}>
          <UpvoteIcon classes={classes}/>
          Seeks Truth
        </div>
        <div className={classes.rightSide}>
          <DownvoteIcon classes={classes}/>
          Seeks Conflict
        </div>
      </div>
      
      <div className={classes.divider}/>
      
      <div className={classes.row}>
        <div className={classes.leftSide}>🤨 Skepticism</div>
        <div className={classes.rightSide}>🎉 Enthusiasm</div>
      </div>
      <div className={classes.row}>
        <div className={classes.leftSide}>❤️ Empathy</div>
        <div className={classes.rightSide}>😮 Surprise</div>
      </div>
      
      <div className={classes.divider}/>
      
      <div className={classes.row}>
        <span className={classes.overall}>Overall</span>
        <Components.SmallSideVote noReacts document={document} collection={collection}/>
      </div>
    </div>
  </Card>
};

const VoteReactsFormComponent = registerComponent('VoteReactsForm', VoteReactsForm, {styles});

declare global {
  interface ComponentTypes {
    VoteReactsForm: typeof VoteReactsFormComponent
  }
}
