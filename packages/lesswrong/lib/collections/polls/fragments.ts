import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment PollsBase on Poll {
    _id
    userId
    question
    contents
  }
`);

