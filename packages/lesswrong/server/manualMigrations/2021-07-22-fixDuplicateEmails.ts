import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { mergeSingleUser, DuplicateUser, MergeAction } from '../scripts/fixDuplicateEmail'
import { mergeAccounts } from '../scripts/mergeAccounts';

type MongoDuplicateUser = {
  '_id': string,
  matches: DuplicateUser[]
}

type MergeResult = {
  email: string,
  action: MergeAction
}

export default registerMigration({
  name: "fixDuplicateEmails",
  dateWritten: "2021-07-22",
  idempotent: true,
  action: async () => {
    /*
      This query looks complicated but it just gets all users with duplicate 
      emails and includes the ids of any posts or comments they have made. 
      Rough SQL equivalent:

      select lower(email),
        user.id,
        user.displayName,
        array_agg(posts.id) as postIds,
        array_agg(comments.id) as commentIds,
        array_agg(emails.address) as arrayEmail
      from users
      left join posts on users.id = posts.userId
      left join comments on users.id = comments.userId
      group by lower(email), user.id
    */
    const userInfo: Array<MongoDuplicateUser> = await Users.aggregate([
      {
        '$match': {
          '$or': [ {'deleted': false}, {'deleted': {'$exists': false}} ]
        }
      },
      {
        '$project': {
          lowerEmail: { $toLower: "$email" },
          displayName: '$displayName',
          arrayEmail: {
            $map: {
              input: "$emails.address",
              as: "arrayEmail",
              in: { $toLower: "$$arrayEmail" }
            }
          }
        }
      },
      {
        '$group': {
          '_id': '$lowerEmail',
          'count': {
            '$sum': 1
          },
          'matches': {
            '$push': {
              '_id': '$_id',
              'email': '$lowerEmail',
              'displayName': '$displayName',
              'arrayEmail': '$arrayEmail'
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
          'posts._id': 1,
          'arrayEmail': 1
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
    const automaticMerges = mergeResults.filter(result => result.action.type !== 'ManualMergeAction')
    for (const merge of automaticMerges) {
      await runSingleMerge(merge)
    }

    // Report results
    mergeResults.forEach(mergeResult => {
      const actionRow = mergeResult.action.type === 'ManualMergeAction' ?
        ['ManualNeeded', mergeResult.action.sourceIds.join('^')].join(',')
        : [mergeResult.action.destinationId, mergeResult.action.sourceIds.join('^'), mergeResult.action.justification].join(',')
      //eslint-disable-next-line no-console
      console.log([mergeResult.email, actionRow].join(','))
    });
  }
})

async function runSingleMerge(merge: MergeResult) {
  if (merge.action.type === 'ManualMergeAction')
    return
  const action = merge.action
  for (const sourceId of action.sourceIds) {
    //eslint-disable-next-line no-console
    console.log('merging account ', sourceId, ' into ', action.destinationId, ' for email ', merge.email)
    await mergeAccounts({sourceUserId: sourceId, targetUserId: action.destinationId, dryRun: false})
  }
}
