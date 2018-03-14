import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import { withRouter } from 'react-router';
import ActionFavorite from 'material-ui/svg-icons/action/favorite';
import ActionFavoriteBorder from 'material-ui/svg-icons/action/favorite-border';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Checkbox from 'material-ui/Checkbox';



const filters = ["LW", "EA", "SSC", "MIRIx"];


class CommunityMapFilter extends Component {
  constructor(props) {
    super(props);
    const filters = this.props.router.location.query && this.props.router.location.query.filters;
    if (Array.isArray(filters)) {
      this.state = {filters: filters}
    } else if (typeof filters === "string") {
      this.state = {filters: [filters]}
    } else {
      this.state = {filters: []}
    }
  }

  handleCheck = (filter) => {
    const router = this.props.router;
    let newFilters = [];
    if (Array.isArray(this.state.filters) && this.state.filters.includes(filter)) {
      newFilters = _.without(this.state.filters, filter);
    } else {
      newFilters = [...this.state.filters, filter];
    }
    this.setState({filters: newFilters});
    router.replace({...router.location, query: {filters: newFilters}})
  }

  render() {
    return <Paper className="community-map-filter-wrapper" zDepth={1}>
      <div className="community-map-filter">
        {filters.map(value => {
          return <Checkbox
            label={value}
            checked={this.state.filters.includes(value)}
            onCheck={() => this.handleCheck(value)}
            labelStyle={{fontFamily: 'Roboto', fontWeight: '500'}}
            style={{marginRight: "5px"}}
            iconStyle={{marginRight: "5px"}}
            key={value}
                 />
        })}
      </div>
    </Paper>
  }
}

registerComponent('CommunityMapFilter', CommunityMapFilter, withRouter);
