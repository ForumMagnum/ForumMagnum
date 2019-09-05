import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import { withLocation, withNavigation } from '../../lib/routeUtil.js';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { groupTypes } from '../../lib/collections/localgroups/groupTypes';
import { withStyles } from '@material-ui/core/styles';
import qs from 'qs'

const availableFilters = _.map(groupTypes, t => t.shortName);

const styles = theme => ({
  root: {
    position: "absolute",
    top: "10px",
    padding: "10px 10px 5px 10px",
    right: "10px"
  },
  filters: {
  },
  checkbox: {
    padding: 0,
    marginRight: 5,
  },
  checkboxLabel: {
    fontFamily: "Roboto",
    fontWeight: 500,
  },
});

class CommunityMapFilter extends Component {
  constructor(props) {
    super(props);
    const { query } = this.props.location;
    const filters = query?.filters
    if (Array.isArray(filters)) {
      this.state = {filters: filters}
    } else if (typeof filters === "string") {
      this.state = {filters: [filters]}
    } else {
      this.state = {filters: []}
    }
  }

  handleCheck = (filter) => {
    const { location, history } = this.props
    let newFilters = [];
    if (Array.isArray(this.state.filters) && this.state.filters.includes(filter)) {
      newFilters = _.without(this.state.filters, filter);
    } else {
      newFilters = [...this.state.filters, filter];
    }
    this.setState({filters: newFilters});
    // FIXME: qs.stringify doesn't handle array parameters in the way react-router-v3
    // did, which causes awkward-looking and backwards-incompatible (but not broken) URLs.
    history.replace({...location.location, search: qs.stringify({filters: newFilters})})
  }

  render() {
    const { classes } = this.props;
    return <Paper className={classes.root} elevation={1}>
      <div className={classes.filters}>
        {availableFilters.map(value => {
          return <React.Fragment key={value}>
            <Checkbox
              checked={this.state.filters.includes(value)}
              onChange={(event, checked) => this.handleCheck(value)}
              className={classes.checkbox}
            />
            <span className={classes.checkboxLabel}>
              {value}
            </span>
            <br/>
          </React.Fragment>
        })}
      </div>
    </Paper>
  }
}

registerComponent('CommunityMapFilter', CommunityMapFilter,
  withLocation, withNavigation,
  withStyles(styles, {name: "CommunityMapFilter"})
);
