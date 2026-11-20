import React from 'react';
import classNames from 'classnames';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { Chip } from '@/components/widgets/Chip';
import Loading from "../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const UsersProfileQuery = gql(`
  query SingleUsersItem($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersProfile
      }
    }
  }
`);

const styles = defineStyles('SingleUsersItem', (theme: ThemeType) => ({
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    maxWidth: '100%',
    height: 'auto',
    backgroundColor: theme.palette.greyAlpha(.05),
    '& .Chip-label': {
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      paddingTop: 3,
      paddingBottom: 3,
    },
  },
  searchChip: {
    margin: 0,
    minHeight: 32,
    borderRadius: 4,
    backgroundColor: theme.palette.greyAlpha(0.06),
    '@media (pointer: coarse)': {minHeight: 40},
    '&:focus-visible': {outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2},
  },
  searchItem: {minWidth: 0, maxWidth: '100%'},
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
}), { stylePriority: 1 });

const SingleUsersItem = ({userId, removeItem, variant}: {
  variant?: "search",
  userId: string,
  removeItem: (id: string) => void,
}) => {
  const classes = useStyles(styles);
  const { loading, data } = useQuery(UsersProfileQuery, {
    variables: { documentId: userId },
  });
  const document = data?.user?.result;

  if (document && !loading) {
    return <span className={classNames("search-results-users-item users-item", {[classes.searchItem]: variant === "search"})}>
      <Chip
        onDelete={() => removeItem(document._id)}
        className={classNames(classes.chip, {[classes.searchChip]: variant === "search"})}
        label={document.displayName}
      />
    </span>
  } else {
    return <Loading />
  }
};

export default SingleUsersItem;


