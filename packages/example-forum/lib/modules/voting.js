import { makeVoteable } from 'meteor/vulcan:voting';
import { Posts } from './posts/index.js';

makeVoteable(Posts);
