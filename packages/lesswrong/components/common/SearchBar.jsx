import React, { Component } from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import { InstantSearch, SearchBox } from 'react-instantsearch/dom';
import FontIcon from 'material-ui/FontIcon';
import { withStyles } from '@material-ui/core/styles';

const closeIconStyle = {
  fontSize: '14px',
}

const searchIconStyle = {
  position: 'fixed',
  padding: '12px',
}

const styles = theme => ({
  search: {
    display:"flex",
    justifyContent:"space-between",
    alignItems: "center",
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    '& h1': {
      margin:0
    }
  }
})

class SearchBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      inputOpen: false,
      searchOpen: false,
      currentQuery: "",
    }
  }

  openSearchInput = () => {
    this.setState({inputOpen: true});
  }

  closeSearchInput = () => {
    this.setState({inputOpen: false});
  }

  openSearchResults = () => {
    this.setState({searchOpen: true});
  }

  closeSearchResults = () => {
    this.setState({searchOpen: false});
  }

  closeSearch = () => {
    this.setState({searchOpen: false, inputOpen: false});
  }

  handleSearchTap = () => {
    this.setState({inputOpen: true, searchOpen: this.state.currentQuery});
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape') this.closeSearch();
  }

  queryStateControl = (searchState) => {
    if (searchState.query !== this.state.currentQuery) {
      this.setState({currentQuery: searchState.query});
      if (searchState.query) {
        this.openSearchResults();
      } else {
        this.closeSearchResults();
      }
    }
  }

  render() {
    const inputOpenClass = this.state.inputOpen ? "open" : null;
    const algoliaAppId = getSetting('algolia.appId')
    const algoliaSearchKey = getSetting('algolia.searchKey')

    const { classes } = this.props
    const { searchOpen } = this.state

    if(!algoliaAppId) {
      return <div className="search-bar">Search is disabled (Algolia App ID not configured on server)</div>
    }

    searchIconStyle.color = this.props.color;
    closeIconStyle.color = this.props.color;

    return <div onKeyDown={this.handleKeyDown}>
      <Components.ErrorBoundary>
        <InstantSearch
          indexName="test_posts"
          appId={algoliaAppId}
          apiKey={algoliaSearchKey}
          onSearchStateChange={this.queryStateControl}
        >
          <div className={"search-bar " + inputOpenClass}>
            <div onClick={this.handleSearchTap}>
              <FontIcon className="material-icons" style={searchIconStyle}>search</FontIcon>
              <SearchBox resetComponent={<div></div>} focusShortcuts={[]} />
            </div>
            <div className="search-bar-close" onClick={this.closeSearch}>
              <FontIcon className="material-icons" style={closeIconStyle}>close</FontIcon>
            </div>
          </div>
          { searchOpen && <Components.SearchBarResults />}
        </InstantSearch>
      </Components.ErrorBoundary>
    </div>
  }
}

SearchBar.propTypes = {
  color: PropTypes.string,
};

SearchBar.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

registerComponent("SearchBar", SearchBar, withStyles(styles));
