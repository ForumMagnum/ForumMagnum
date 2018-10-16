import { Components, registerComponent, getSetting, registerSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';

registerSetting('forum.numberOfDays', 5, 'Number of days to display in Daily view');

const styles = theme => ({
  titleSettings: {
    marginTop: 10,
    width: 150,
    
    [theme.breakpoints.up('md')]: {
      float: "right"
    }
  },
  checkbox: {
    padding: 0
  },
  checkboxChecked: {
    // Tone down the material-UI default color to the shade old-material-UI was
    // using, since the new, darker green doesn't fit the deemphasized position
    // this element is in.
    "& svg": {
      color: "rgba(100, 169, 105, 0.7)"
    }
  },
  checkboxLabel: {
    ...theme.typography.subheading,
    marginLeft: 5
  },
});

class PostsDaily extends Component {

  constructor(props, context) {
    super(props)
    this.state = {
      hideLowKarma: true,
    }
  }

  renderTitle = () => {
    const { classes } = this.props;
    return <div className={classes.titleSettings}>
      <Checkbox
        classes={{root: classes.checkbox, checked: classes.checkboxChecked}}
        checked={this.state.hideLowKarma}
        onChange={(event, checked) => this.setState({hideLowKarma: checked})}
      />
      <span className={classes.checkboxLabel}>
        Hide Low Karma
      </span>
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
          <Components.PostsDailyList title="Posts by Day"
            terms={terms} days={numberOfDays}/>
        </div>
      </Components.Section>
    </div>
  }
}

PostsDaily.displayName = 'PostsDaily';

registerComponent('PostsDaily', PostsDaily, withStyles(styles, {name: "PostsDaily"}));
