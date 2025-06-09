import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { Chip } from '@/components/widgets/Chip';
import Loading from "../vulcan-core/Loading";

const UsersProfileQuery = gql(`
  query SingleUsersItem($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersProfile
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  chip: {
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: theme.palette.background.usersListItem,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
});

const SingleUsersItem = ({userId, removeItem, classes }: {
  userId: string,
  removeItem: (id: string) => void,
  classes: ClassesType<typeof styles>
}) => {
  const { loading, data } = useQuery(UsersProfileQuery, {
    variables: { documentId: userId },
  });
  const document = data?.user?.result;

  if (document && !loading) {
    return <span className="search-results-users-item users-item">
      <Chip
        onDelete={() => removeItem(document._id)}
        className={classes.chip}
        label={document.displayName}
      />
    </span>
  } else {
    return <Loading />
  }
};

export default registerComponent('SingleUsersItem', SingleUsersItem, {styles});


