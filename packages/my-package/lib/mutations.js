import Telescope, { newMutation } from 'meteor/nova:lib';

const mutations = {
  new: {
    
    name: 'moviesNew',
    
    check(user) {
      return !!user;
    },
    
    mutation(root, {document}, context) {
      if (!this.check(context.currentUser, document)){
        throw new Error('Mutation error!');
      }
      return newMutation({
        collection: context.Movies,
        document: document, 
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  }
};

export default mutations;