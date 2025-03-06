import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import Chip from '@material-ui/core/Chip';
import { Loading } from "@/components/vulcan-core/Loading";

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
  const { document, loading } = useSingle({
    documentId: userId,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
  });

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

const SingleUsersItemComponent = registerComponent('SingleUsersItem', SingleUsersItem, {styles});

declare global {
  interface ComponentTypes {
    SingleUsersItem: typeof SingleUsersItemComponent
  }
}

export default SingleUsersItemComponent;
