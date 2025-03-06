import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Pagination } from 'react-instantsearch-dom';

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    ...theme.typography.smallCaps,
    '& .ais-Pagination': {
      width: 'auto',
      display: 'inline-block',
      padding: '8px 0px',
      boxShadow: "none",
      border: "none",
    },
    '& .ais-Pagination-link:focus': {
      // Disable focused-link greying because it looks too much like a greyed
      // out link in this context
      opacity: "initial",
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
        color: theme.palette.text.normal,
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
    '& .ais-Pagination-link--selected': {
      cursor: "initial",
    },
  }
})
const SearchPagination = ({classes, pagesPadding=0, showFirst=false}: {
  classes: ClassesType<typeof styles>,
  pagesPadding?: number,
  showFirst?: boolean,
}) => {
  return <div className={classes.root}>
    <Pagination padding={pagesPadding} showFirst={showFirst}/>
  </div>
}

const SearchPaginationComponent = registerComponent("SearchPagination", SearchPagination, {styles});

declare global {
  interface ComponentTypes {
    SearchPagination: typeof SearchPaginationComponent
  }
}

export default SearchPaginationComponent;

