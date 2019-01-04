import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  titleSettings: {
    width: "100%",
    fontStyle: "italic",
    cursor: "pointer",
    opacity: .8,
    [theme.breakpoints.up('md')]: {
      float: "right"
    },
    '&:hover': {
      opacity:1,
    },
    '& svg': {
      width: ".8em",
      marginTop: -4,
      marginRight: 3
    }
  },
  checkbox: {
    padding: 0,
  },
  checkboxChecked: {
    // Tone down the material-UI default color to the shade old-material-UI was
    // using, since the new, darker green doesn't fit the deemphasized position
    // this element is in.
    "& svg": {
      color: "rgba(100, 169, 105, 0.7)",
    }
  },
  checkboxLabel: {
    ...theme.typography.subheading,
    marginLeft: 5
  },
  divider: {
    margin:"10px 0 12px 82%",
    borderBottom: "solid 1px rgba(0,0,0,.15)"
  }
});

class AllPostsPage extends Component {

  state = { lowKarma: false }

  renderTitle = () => {
    const { classes } = this.props;
    const { lowKarma } = this.state
    const { PostsViews } = Components
    return <div>
      <PostsViews />
      <div className={classes.divider} />
      <Tooltip title="Show low karma posts" placement="right">
        <div className={classes.titleSettings} onClick={(event) => this.setState({lowKarma: !lowKarma})}>
          <Checkbox
            classes={{root: classes.checkbox, checked: classes.checkboxChecked}}
            checked={lowKarma}
          />
          <span className={classes.checkboxLabel}>
            Low Karma
          </span>
        </div>
      </Tooltip>
    </div>
  }

  render() {

    const query = _.clone(this.props.router.location.query || {});

    const terms = {
      view:"new",
      ...query,
      karmaThreshold: this.state.lowKarma ? -100 : -10,
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
