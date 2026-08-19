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
    backgroundColor: theme.palette.greyAlpha(.05),
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
  },
}));

const SingleUsersItem = ({userId, removeItem}: {
  userId: string,
  removeItem: (id: string) => void,
}) => {
  const classes = useStyles(styles);
  const { loading, data } = useQuery(UsersProfileQuery, {
    variables: { documentId: userId },
  });
  const document = data?.user?.result;

  if (document && !loading) {
    return <span className={classNames("search-results-users-item users-item", classes.wrapper)}>
      <Chip
        onDelete={() => removeItem(document._id)}
        className={classes.chip}
        label={document.displayName}
        wrapLabel
      />
    </span>
  } else {
    return <Loading />
  }
};

export default SingleUsersItem;


