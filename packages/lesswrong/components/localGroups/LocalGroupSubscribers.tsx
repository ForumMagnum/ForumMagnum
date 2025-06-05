import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { Typography } from "../common/Typography";
import UsersNameDisplay from "../users/UsersNameDisplay";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const MembersOfGroupFragmentMultiQuery = gql(`
  query multiSubscriptionLocalGroupSubscribersQuery($selector: SubscriptionSelector, $limit: Int, $enableTotal: Boolean) {
    subscriptions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...MembersOfGroupFragment
      }
      totalCount
    }
  }
`);

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
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(MembersOfGroupFragmentMultiQuery, {
    variables: {
      selector: { membersOfGroup: { documentId: groupId } },
      limit: 20,
      enableTotal: true,
    },
    itemsPerPage: 100,
  });

  const results = data?.subscriptions?.results;

  const totalCount = data?.subscriptions?.totalCount;

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

export default registerComponent('LocalGroupSubscribers', LocalGroupSubscribers, {styles});



