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
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  input: {
    minWidth: 0,
    width: '100%',
    '& input': {
      ...theme.typography.body2,
      width: '100%',
      minWidth: 0,
      height: 38,
      boxSizing: 'border-box',
      padding: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: theme.palette.text.normal,
      fontSize: 14,
      '&::placeholder': {color: theme.palette.text.dim, opacity: 1},
      '@media (pointer: coarse)': {fontSize: 16},
    },
    '& .MuiInput-root, & > input': {
      width: '100%',
      minHeight: 40,
      padding: '0 12px',
      boxSizing: 'border-box',
      border: theme.palette.greyBorder('1px', 0.08),
      borderRadius: 8,
      backgroundColor: theme.palette.greyAlpha(0.035),
      transition: 'background-color 150ms, border-color 150ms, box-shadow 150ms',
      '&:hover': {borderColor: theme.palette.greyAlpha(0.18)},
      '&:focus-within': {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 1px ${theme.palette.primary.main}, 0 2px 8px ${theme.palette.boxShadowColor(0.06)}`,
        '& .MuiInputAdornment-root': {color: theme.palette.primary.main},
      },
    },
    '& .MuiInputAdornment-root': {
      marginRight: 8,
      color: theme.palette.text.dim,
      '& svg': {width: 18, height: 18},
    },
    '& .react-autosuggest__suggestions-list': {
      margin: '6px 0 0',
      padding: 4,
      borderRadius: 8,
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.08)}`,
    },
    '& .react-autosuggest__suggestion': {
      padding: '8px',
      minHeight: 40,
      boxSizing: 'border-box',
      borderRadius: 4,
      cursor: 'pointer',
      '&:hover': {backgroundColor: theme.palette.greyAlpha(0.05)},
    },
  },
  selectedAuthors: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
    width: '100%',
    '& .users-item': {minWidth: 0, maxWidth: '100%'},
    '& .SingleUsersItem-chip': {
      margin: 0,
      minHeight: 32,
      borderRadius: 4,
      backgroundColor: theme.palette.greyAlpha(0.06),
      '@media (pointer: coarse)': {minHeight: 40},
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
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
    {!!authorIds.length && <div className={classes.selectedAuthors}>
      {authorIds.map(userId => <SingleUsersItem key={userId} userId={userId} removeItem={remove} />)}
    </div>}
    <ErrorBoundary>
      <div className={classes.input}>
        <UsersSearchAutoComplete clickAction={add} label="Filter by author" disableUnderline />
      </div>
    </ErrorBoundary>
  </div>;
};

export default SearchAuthorsBar;
