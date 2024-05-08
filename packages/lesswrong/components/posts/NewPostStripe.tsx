import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    // position: "absolute",
    height: "46px",
    width: 2,
  },
  isNew: {
    background: theme.palette.primary.main,
  }
});

export const NewPostStripe = ({classes, post}: {
  classes: ClassesType,
  post: PostsListWithVotes
}) => {

  const isNew = moment().diff(post.postedAt, 'days') < 2;

  console.log("isNew", isNew);
  return  <span>
    <div className={classNames(classes.root, {[classes.isNew]: isNew})}/>
  </span>
}

const NewPostStripeComponent = registerComponent('NewPostStripe', NewPostStripe, {styles});

declare global {
  interface ComponentTypes {
    NewPostStripe: typeof NewPostStripeComponent
  }
}

