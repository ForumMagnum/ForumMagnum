import { wrapVulcanAsyncScript } from './utils'
import { Vulcan } from '../vulcan-lib';
import { userIPBanAndResetLoginTokens, userDeleteContent } from '../callbacks';
import Users from '../../lib/collections/users/collection'
import moment from 'moment'

const banUser = async (user: DbUser) => {
  await Users.rawCollection().bulkWrite([{
    updateOne: {
      filter: {_id: user._id},
      update: {
        $set: {
          bio: '',
          htmlBio: '',
          banned: moment().add(12, 'months').toDate(),
          deleteContent: true,
        },
      },
    }
  }])
  void userIPBanAndResetLoginTokens(user);
  void userDeleteContent(user);
}

Vulcan.oneOffBanSpammers = wrapVulcanAsyncScript(
  'oneOffBanSpammers',
  async () => {
    const spammers = Users.find({
      // signUpReCaptchaRating: {$exists: false},
      reviewedByUserId: {$exists: false},
      createdAt: {
        $gte: moment.utc("2019-05-21").toDate(),
        $lt: moment.utc("2019-06-13").toDate(),
      },
      banned: {$exists: false},
      $or: [
        {bio: {$exists: true}},
        {commentCount: {$gt: 0}},
        {postCount: {$gt: 0}},
        {signUpReCaptchaRating: {$lt: 0.4}},
      ]
    })
    // eslint-disable-next-line no-console
    console.log('Spammer count', spammers.count())
    for (const spammer of spammers.fetch()) {
      await banUser(spammer)
    }
  }
)
