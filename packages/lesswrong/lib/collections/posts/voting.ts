import { makeVoteable } from '../../make_voteable';
import { Posts } from './collection'

makeVoteable(Posts, {
  timeDecayScoresCronjob: true,
});
