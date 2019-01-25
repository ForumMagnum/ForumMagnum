import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment';
import { withRouter } from 'react-router';

const styles = theme => ({
  titleSettings: {
    marginLeft: theme.spacing.unit,
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

  render() {
    const { classes } = this.props;
    const { lowKarma } = this.state

    const { PostsViews, PostsList, TabNavigationMenu, SingleColumnSection, SectionTitle } = Components
    const query = _.clone(this.props.router.location.query || {view:"daily"});
    console.log(query)
    const terms = {
      view: "daily",
      ...query,
      karmaThreshold: this.state.lowKarma ? -100 : -10,
      limit:100
    }

    const numberOfDays = getSetting('forum.numberOfDays', 5);
    const dailyTerms = {
      view: 'daily',
      after: moment().utc().subtract(numberOfDays - 1, 'days').format('YYYY-MM-DD'),
      before: moment().utc().add(1, 'days').format('YYYY-MM-DD'),
      karmaThreshold: this.state.hideLowKarma ? -10 : -100
    };

    return (
      <SingleColumnSection>
        <SectionTitle title="All Posts" >
          <PostsViews showPostTypes={false} defaultView="daily"/>
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
        </SectionTitle>
        <TabNavigationMenu />
          {query.view === "daily" ? 
            <Components.PostsDailyList title="Posts by Day" terms={dailyTerms} days={numberOfDays}/>
            :
            <PostsList terms={terms} showHeader={false}/>
          }
      </SingleColumnSection>
    )
  }
}
registerComponent('AllPostsPage', AllPostsPage, withStyles(styles, {name:"AllPostsPage"}), withRouter);
