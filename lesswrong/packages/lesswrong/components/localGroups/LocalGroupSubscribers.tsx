import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { useMulti } from '@/lib/crud/withMulti';
import { Typography } from "@/components/common/Typography";
import UsersNameDisplay from "@/components/users/UsersNameDisplay";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  title: {
    marginTop: 24,
  },
  subscriberList: {
  },
  subscriber: {
  },
})

const LocalGroupSubscribers = ({groupId, classes}: {
  groupId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {results, totalCount, loading, loadMoreProps} = useMulti({
    collectionName: "Subscriptions",
    fragmentName: "MembersOfGroupFragment",
    terms: {
      view: "membersOfGroup",
      documentId: groupId,
    },
    enableTotal: true,
    limit: 20,
    itemsPerPage: 100,
  });

  return <div>
    <Typography variant="headline" className={classes.title}>
      {preferredHeadingCase("Subscribers")}{!loading && ` (${totalCount})`}
    </Typography>
    
    <Typography variant="body2" className={classes.subscriber}>
      <ol className={classes.subscriberList}>
        {results?.map(result => (result.user) && <li key={result.user._id}>
            <UsersNameDisplay user={result.user}/>
        </li>)}
      </ol>
    </Typography>
    
    <LoadMore {...loadMoreProps} />
  </div>
}

const LocalGroupSubscribersComponent = registerComponent('LocalGroupSubscribers', LocalGroupSubscribers, {styles});

declare global {
  interface ComponentTypes {
    LocalGroupSubscribers: typeof LocalGroupSubscribersComponent
  }
}

export default LocalGroupSubscribersComponent;

