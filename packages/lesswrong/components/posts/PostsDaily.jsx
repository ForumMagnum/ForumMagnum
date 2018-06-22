import { Components, registerComponent, getSetting, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

registerSetting('forum.numberOfDays', 5, 'Number of days to display in Daily view');

const PostsDaily = props => {
  // const terms = props.location && props.location.query;
  const numberOfDays = getSetting('forum.numberOfDays', 5);
  const terms = {
    view: 'top',
    meta: null, // Show both frontpage and meta posts on daily
    after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
    before: moment().utc().format('YYYY-MM-DD'),
  };

  console.log('PostsDaily.terms: ', terms);
  return <Components.PostsDailyList terms={terms}/>
};

PostsDaily.displayName = 'PostsDaily';

registerComponent('PostsDaily', PostsDaily);
