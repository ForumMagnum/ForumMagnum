"use client";
import React, { useState } from 'react';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import InputAdornment from '@/lib/vendor/@material-ui/core/src/InputAdornment';
import SearchIcon from '@/lib/vendor/@material-ui/icons/src/Search';
import LocalGroupsList from "./LocalGroupsList";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('AllGroupsPage', (theme: ThemeType) => ({
  search: {
    ...theme.typography.body1,
    width: "100%",
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    padding: "10px 16px",
    marginBottom: 16,
  },
  searchIcon: {
    color: theme.palette.icon.dim3,
  },
}));

const AllGroupsPage = () => {
  const classes = useStyles(styles);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SingleColumnSection>
      <SectionTitle title="All Groups"/>
      <Input
        className={classes.search}
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
        placeholder="Search by group or location"
        inputProps={{ "aria-label": "Search groups by name or location" }}
        startAdornment={<InputAdornment position="start">
          <SearchIcon className={classes.searchIcon} />
        </InputAdornment>}
        disableUnderline
      />
      <LocalGroupsList
        view="all"
        limit={1000}
        terms={{}}
        searchQuery={searchQuery}
      />
    </SingleColumnSection>
  )
}

export default AllGroupsPage;
