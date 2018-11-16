import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import { Pagination } from 'react-instantsearch-dom';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontVariant: "small-caps",
    '& .ais-Pagination': {
      width: 'auto',
      display: 'inline-block',
      padding: '8px 0px',
      boxShadow: "none",
      border: "none",
    },
    '& .ais-Pagination-item': {
      marginLeft: 10,
    },
    '& .ais-Pagination-item--disabled': {
      opacity: 0.5,
    },
    '& .ais-Pagination-item--selected': {
      color: "inherit",
      background: "inherit"
    },
    '& .ais-Pagination-item:hover': {
      background: "transparent",
      '& .ais-Pagination-link': {
        color: "rgba(0,0,0,0.87)",
      }
    },
    '& .ais-Pagination-item--nextPage .ais-Pagination-link':{
      fontSize:0,
      '&:before': {
        fontSize: theme.typography.body2.fontSize,
        content: '"Next"'
      }
    },
    '& .ais-Pagination-item--previousPage .ais-Pagination-link':{
      fontSize:0,
      '&:before': {
        fontSize: theme.typography.body2.fontSize,
        content: '"Prev"'
      }
    },
  }
})
const SearchPagination = ({classes, pagesPadding=0, showFirst=false}) => {
    return <div className={classes.root}>
      <Pagination padding={pagesPadding} showFirst={showFirst}/>
    </div>
}

registerComponent("SearchPagination", SearchPagination, withStyles(styles, {name: "SearchPagination"}));
