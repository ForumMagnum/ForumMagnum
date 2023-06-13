import { registerMigration } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { createMutator, Utils } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { mapsAPIKeySetting } from '../../components/form-components/LocationFormComponent';
import { Comments } from '../../lib/collections/comments';
import { fs } from 'mz';
import { getSqlClientOrThrow } from '../../lib/sql/sqlClient';


function saveAsCSV(results: Array<any>, filename: string) {
  const header = '_id,displayName,oldKarma,newKarma10,newKarma5,newKarma2\n';
  const fileRows = results.map(row => `${row._id},${row.displayName},${row.oldKarma},${row.newKarma10},${row.newKarma5},${row.newKarma2}`).join('\n');
  fs.writeFileSync(filename, header + fileRows);
}

registerMigration({
  name: "testStricterKarma",
  dateWritten: "2023-06-12",
  idempotent: true,
  action: async () => {
    const users = await Users.find({_id:"qgdGA4ZEyW7zNdK84"}).fetch()
    // const users = await Users.find({karma: {$ne: null}},{sort:{lastNotificationsCheck: -1}, limit: 500, projection: {_id:1, karma:1, displayName:1, lastNotificationsCheck:1}}).fetch()
    let newUsers = []
    for (const user of users) {
      let newKarma10 = 0
      let newKarma5 = 0
      const posts = await Posts.find({userId: user._id}, {projection:{baseScore:1}}).fetch()
      const comments = await Comments.find({userId: user._id}, {projection:{baseScore:1}}).fetch()
      for (const post of posts) {
        if (post.baseScore > 10) { newKarma10 += post.baseScore - 10 }
        if (post.baseScore > 5) { newKarma5 += post.baseScore - 5 }
        if (post.baseScore < 0) { 
          newKarma10 += post.baseScore
          newKarma5 += post.baseScore 
        }
      }
      for (const comment of comments) {
        if (comment.baseScore > 10) { newKarma10 += comment.baseScore - 10 }
        if (comment.baseScore > 5) { newKarma5 += comment.baseScore - 5 }
        if (comment.baseScore < 0) { 
          newKarma10 += comment.baseScore
          newKarma5 += comment.baseScore 
        }
      }
      const result = {_id: user._id, displayName: user.displayName, oldKarma: user.karma, newKarma10, newKarma5}
      newUsers.push(result)
      console.log(result)
    }
    saveAsCSV(newUsers, 'testStricterKarma.csv')
  }
})
