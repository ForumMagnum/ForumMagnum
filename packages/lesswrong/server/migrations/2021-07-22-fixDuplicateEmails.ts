import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { mergeSingleUser, DuplicateUser, RunnableMergeAction } from '../scripts/fixDuplicateEmail'
import { Vulcan } from '../../lib/vulcan-lib';
import '../scripts/mergeAccounts';

type MongoDuplicateUser = {
  '_id': string,
  matches: DuplicateUser[]
}

registerMigration({
  name: "fixDuplicateEmails",
  dateWritten: "2021-07-22",
  idempotent: true,
  action: async () => {
    /*
      This query looks complicated but it just gets all users with duplicate 
      emails and includes the ids of any posts or comments they have made
    */
    const userInfo: Array<MongoDuplicateUser> = await Users.aggregate([
        {
          '$match': {
            'deleted': false
          }
        }, {
          '$group': {
            '_id': '$email',
            'count': {
              '$sum': 1
            },
            'matches': {
              '$push': {
                '_id': '$_id',
                'email': '$email',
                'username': '$username'
              }
            }
          }
        }, {
          '$match': {
            'count': {
              '$gt': 1
            }
          }
        },
        {
          $unwind:
          {
            path: '$matches',
          }
        },
        {
          '$lookup': {
            from: 'comments',
            localField: 'matches._id',
            foreignField: 'userId',
            as: 'comments',
          }
        },
        {
          '$lookup': {
            from: 'posts',
            localField: 'matches._id',
            foreignField: 'userId',
            as: 'posts',
          }
        },
        {
          $project: {
            '_id': 1,
            'matches': 1,
            'comments._id': 1,
            'posts._id': 1
          }
        }, {
          '$group': {
            '_id': '$_id',
            'count': {
              '$sum': 1
            },
            'matches': {
              '$push': '$$ROOT'
            }
          }
        }
      ]).toArray()

    // The Mongo aggregation requires the id to be the email address,
    // so we need to replace the email address with the actual record id
    const cleanUserInfo = userInfo.map(user => ({
      ...user,
      matches: user.matches.map(match => ({
        ...match,
        '_id': match.matches?._id || ''
      }))
    }))

    // Compute a list of merges to run
    const mergeResults = cleanUserInfo.map(user => ({
      email: user['_id'],
      action: mergeSingleUser(user.matches)
    }))
    
    // do the merge
    await mergeResults.filter(result => result.action != 'ManualNeeded').forEach(async result => {
      const action = result.action as RunnableMergeAction
      action.sourceIds.forEach(async sourceId => {
        //eslint-disable-next-line no-console
        console.log('merging account ', sourceId, ' into ', action.destinationId, ' for email ', result.email)
        await Vulcan.mergeAccounts(sourceId, action.destinationId)
      })
    })

    // Report results
    mergeResults.forEach(mergeResult => {
      const actionRow = mergeResult.action == 'ManualNeeded' ? 'ManualNeeded' :
        [mergeResult.action.destinationId, mergeResult.action.sourceIds.join('^'), mergeResult.action.justification].join(',')
      //eslint-disable-next-line no-console
      console.log([mergeResult.email, actionRow].join(','))
    });
  }
})
