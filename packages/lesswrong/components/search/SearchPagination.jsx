import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import { Pagination } from 'react-instantsearch/dom';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontVariant: "small-caps",
    '& .ais-Pagination__root': {
      boxShadow: "none",
      border: "none",
    },
    '& .ais-Pagination__itemSelected': {
      color: "inherit",
      background: "inherit"
    },
    '& .ais-Pagination__item:hover': {
      background: "transparent",
      '& .ais-Pagination__itemLink': {
        color: "rgba(0,0,0,0.87)",
      }
    },
    '& .ais-Pagination__itemNext .ais-Pagination__itemLink':{
      fontSize:0,
      '&:before': {
        fontSize: theme.typography.body2.fontSize,
        content: '"Next"'
      }
    },
    '& .ais-Pagination__itemPrevious .ais-Pagination__itemLink':{
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
      <Pagination pagesPadding={pagesPadding} showFirst={showFirst}/>
    </div>
}

registerComponent("SearchPagination", SearchPagination, withStyles(styles));
