import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';

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

class AllPostsPage extends Component {

  state = { hideLowKarma: true }

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
    const terms = {
      view:"new",
      karmaThreshold: this.state.hideLowKarma ? -10 : -100,
      limit:100
    }

    const { Section, PostsList } = Components

    return (
      <Section title="All Posts" titleComponent={this.renderTitle()}>
          <PostsList terms={terms} showHeader={false}/>
      </Section>
    )
  }
}
registerComponent('AllPostsPage', AllPostsPage, withStyles(styles, {name:"AllPostsPage"}));
