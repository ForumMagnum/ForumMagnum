import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper'
import { useMulti } from '../../lib/crud/withMulti';

const styles = theme => ({

})

const NewUsersDashboard = ({classes}:{classes: ClassesType}) => {

  const { SingleColumnSection, SectionTitle } = Components
  
  const { results, loading } = useMulti({
    terms: {view:"newUsers"},
    collection: Users,
    fragmentName: 'SunshineUsersList',
    fetchPolicy: 'cache-and-network',
  });

  return <SingleColumnSection>
    <SectionTitle title="New Users Dashboard"/>
    {results.map(user=><div className={classes.user} key={user._id}>
      <div>{user.displayName}</div>
      <div>
        {user.recentPosts.map(post=><div key={post._id}>
          {post.karma} {post.title} 
        </div>)}
      </div>
    </div>)}
  </SingleColumnSection>
}


const NewUsersDashboardComponent = registerComponent('NewUsersDashboard', NewUsersDashboard, {styles});

declare global {
  interface ComponentTypes {
    NewUsersDashboard: typeof NewUsersDashboardComponent
  }
}
