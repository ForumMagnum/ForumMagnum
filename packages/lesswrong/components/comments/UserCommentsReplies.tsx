import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useMulti } from '../../lib/crud/withMulti';
import { getUserFromResults } from '../users/UsersProfile';
import { slugify } from '@/lib/utils/slugify';

const styles = (theme: ThemeType) =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  }
})

const UserCommentsReplies = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { SingleColumnSection, SectionTitle, Loading } = Components

  const { params } = useLocation();
  const slug = slugify(params.slug);

  const {results: userResults} = useMulti({
    terms: {view: 'usersProfile', slug},
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
  });
  const user = getUserFromResults(userResults ?? null)
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms: {view: 'allRecentComments', authorIsUnreviewed: null, limit: 50, userId: user?._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
    skip: !user
  });
  
  if (loadingInitial || !user) return <Loading />
  if (!results || results.length < 1) return <SingleColumnSection>
    This user has not made any comments
  </SingleColumnSection>

  return (
    <SingleColumnSection>
      <SectionTitle title={`All of ${user.displayName}'s Comments + Replies`}/>
      <div className={classes.root}>
        {results.map(comment =>
          <div key={comment._id}>
            <Components.CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true
              }}
              comment={comment}
              startThreadTruncated={true}
              loadChildrenSeparately
              loadDirectReplies
            />
          </div>
        )}
        <Components.LoadMore {...loadMoreProps} />
      </div>
    </SingleColumnSection>
  )
};

const UserCommentsRepliesComponent = registerComponent('UserCommentsReplies', UserCommentsReplies, { styles });

declare global {
  interface ComponentTypes {
    UserCommentsReplies: typeof UserCommentsRepliesComponent,
  }
}
