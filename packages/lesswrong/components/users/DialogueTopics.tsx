
// Should this be its own component?
// yes -- and suggestTopic should probably be moved to helpers.ts

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
