import Users from '../../lib/collections/users/collection';
import { newMutation } from '../vulcan-lib';

const createUser = user => {
  
  // if user has an email, copy it over to emails array
  if(user.email) {
    user.emails = [{address: user.email, verified: false}];
  }

  user.services = {};

  void newMutation({
    collection: Users, 
    document: user,
    validate: false
  });
};

export default createUser;
