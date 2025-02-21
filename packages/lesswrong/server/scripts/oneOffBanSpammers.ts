import { wrapVulcanAsyncScript } from './utils'
import { Vulcan } from '../../lib/vulcan-lib/config';
import { userIPBanAndResetLoginTokens, userDeleteContent } from '../callbacks';
import Users from '../../lib/collections/users/collection'
import moment from 'moment'

const banUser = async (user: DbUser, adminUser: DbUser) => {
  // this was not updated when we moved from the "bio" field to the "biography" field,
  // because I'm not sure if this will ever be used again,
  // but note that if we use this we might want to update the fields
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
  void userDeleteContent(user, adminUser);
}

Vulcan.oneOffBanSpammers = wrapVulcanAsyncScript(
  'oneOffBanSpammers',
  async (adminId: string) => {
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
    console.log('Spammer count', await spammers.count())
    const adminUser = await Users.findOne({_id: adminId})
    if (!adminUser) {
      throw Error("Can't find admin User with the given ID. Please provide valid admin user ID.")
    }
    for (const spammer of await spammers.fetch()) {
      await banUser(spammer, adminUser)
    }
  }
)
