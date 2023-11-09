import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';

// Should this be its own component?
// I vote yes

const GetPostsByUserReacts = ({userId, reactType = null}: {
    userId: string,
    reactType?: string | null
  }) => {
    const defaultLimit = 10;
    const pageSize = 30;
    
    const currentUser = useCurrentUser();
    const targerUser = useCurrentUser();

    // how do I pass in the userId for the other user?
    const {loadMoreProps, results} = usePaginatedResolver({
        fragmentName: "ReactsAll",
        resolverName: "Reacts",
        limit: 3,
        itemsPerPage: 5,
      });


    
  
    // if (loading) return <div>Loading...</div>
  
    return (<div>Retrieved votes</div>)
  };

const MyComponentComponent = registerComponent("MyComponent", MyComponent);

declare global {
  interface ComponentTypes {
    MyComponent: typeof MyComponentComponent
  }
}

type DialogueTopic = {
    topic: string;
    agreeUserIds: string[];
    disagreeUserIds: string[];
  };

async function suggestTopic(user1: UsersCurrent, user2: UsersCurrent): Promise<DialogueTopic> {
    
    
    // Logic to generate a topic based on the two users
    // This could involve analyzing their previous posts, comments, interests, etc.




    // For now, let's return a dummy topic
    return {
        topic: "Dummy topic",
        agreeUserIds: [],
        disagreeUserIds: []
    };
}

// // You can get the count of users who have agreed or disagreed as follows:
// const topic: DialogueTopic = suggestTopic(user1, user2)/* get a topic */
// const agreeCount = topic.agreeUserIds.length;
// const disagreeCount = topic.disagreeUserIds.length;
