import { makeVoteable } from 'meteor/vulcan:voting';
import { Posts } from './collection.js'
makeVoteable(Posts);
