import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import UsersSearchAutoComplete from './UsersSearchAutoComplete';
import SingleUsersItem from '../form-components/SingleUsersItem';
import ErrorBoundary from '../common/ErrorBoundary';

const styles = defineStyles("SearchAuthorsBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  input: {
    minWidth: 200,
    "& input": {
      ...theme.typography.body2,
      fontSize: 14,
      padding: "6px 8px",
      border: theme.palette.border.slightlyIntense2,
      borderRadius: 3,
      background: "transparent",
    },
  },
}));

/** Restricts results to what the chosen people wrote, plus their profiles. */
const SearchAuthorsBar = ({authorIds, onChange}: {
  authorIds: string[],
  onChange: (authorIds: string[]) => void,
}) => {
  const classes = useStyles(styles);
  const add = (userId: string) => {
    if (!authorIds.includes(userId)) onChange([...authorIds, userId]);
  };
  const remove = (userId: string) => onChange(authorIds.filter(id => id !== userId));
  return <div className={classes.root} role="group" aria-label="Authors">
    {authorIds.map(userId => <SingleUsersItem key={userId} userId={userId} removeItem={remove} />)}
    <ErrorBoundary>
      <div className={classes.input}>
        <UsersSearchAutoComplete clickAction={add} label="Filter by author" />
      </div>
    </ErrorBoundary>
  </div>;
};

export default SearchAuthorsBar;
