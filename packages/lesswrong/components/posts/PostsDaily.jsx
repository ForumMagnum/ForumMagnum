import { Components, registerComponent, getSetting, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Checkbox from 'material-ui/Checkbox';

registerSetting('forum.numberOfDays', 5, 'Number of days to display in Daily view');

class PostsDaily extends Component {

  constructor(props, context) {
    super(props)
    this.state = {
      hideLowKarma: true,
    }
  }

  handleKarmaChange = () => {
    this.setState({hideLowKarma: !this.state.hideLowKarma})
  }

  renderTitle = () => {
    return <div className="posts-daily-title-settings">
      <Checkbox
        label="Hide Low Karma"
        checked={this.state.hideLowKarma}
        onClick={this.handleKarmaChange}
      />
    </div>
  }

  render() {
    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const terms = {
      view: 'daily',
      meta: null, // Show both frontpage and meta posts on daily
      after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
      before: moment().utc().add(1, 'days').format('YYYY-MM-DD'),
      karmaThreshold: this.state.hideLowKarma ? -10 : -100
    };

    return <div className="posts-daily-wrapper">
      <Components.Section title="Posts by Day" titleComponent={this.renderTitle()}>
        <div className="posts-daily-content-wrapper">
          <Components.PostsDailyList title="Posts by Day" terms={terms}/>
        </div>
      </Components.Section>
    </div>
  }
}

PostsDaily.displayName = 'PostsDaily';

registerComponent('PostsDaily', PostsDaily);
