/*

    # exportPostDetails({ selector, outputDir })

      Script to export a list of post details to a CSV file.

      selector (Object, optional):
        Mongo selector to choose posts. Default is all published pending and approved posts
      outputDir (String, required):
        Absolute path to the directory where you'd like the CSV output to be written
      outputFile (String, optional):
        Filename for your CSV file. Defaults to 'post_details'

    # exportPostDetailsByMonth({ month, outputDir, outputFile })

      Export details for a whole month

      month: (String, optional)
        Month to export posts for in


*/

import moment from 'moment';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { Posts } from '../../server/collections/posts/collection';
import { postStatuses } from '../../lib/collections/posts/constants';
import Users from '../../server/collections/users/collection';
import Tags from '../../server/collections/tags/collection';
import { siteUrlSetting } from '../../lib/instanceSettings';
import { wrapVulcanAsyncScript } from './utils';
import { makeLowKarmaSelector, LOW_KARMA_THRESHOLD } from '../manualMigrations/2020-05-13-noIndexLowKarma';

function getPosts (selector: MongoSelector<DbPost>) {
  const defaultSelector = {
    baseScore: {$gte: 0},
    draft: {$ne: true},
    status: { $in: [postStatuses.STATUS_PENDING, postStatuses.STATUS_APPROVED] },
    authorIsUnreviewed: false,
  }

  const projection: MongoProjection<DbPost> = {
    _id: 1,
    userId: 1,
    title: 1,
    slug: 1,
    baseScore: 1,
    meta: 1,
    frontpageDate: 1,
    postedAt: 1,
    createdAt: 1,
    isEvent: 1,
    isFuture: 1,
    draft: 1,
    status: 1,
    tagRelevance: 1,
  } as const;

  const finalSelector = Object.assign({}, defaultSelector, selector || {})

  return Posts
    .find(finalSelector, {projection, sort: { createdAt: 1 }})
}

export const exportPostDetails = wrapVulcanAsyncScript(
  'exportPostDetails',
  async ({selector, outputDir, outputFile = 'post_details.csv'}: {
    selector: MongoSelector<DbPost>, outputDir: string, outputFile?: string
  }) => {
    if (!outputDir) throw new Error('you must specify an output directory (hint: {outputDir})')
    const documents = getPosts(selector)
    let c = 0
    const count = await documents.count()
    const rows: Array<any> = []
    for (let post of await documents.fetch()) {
      // SD: this makes things horribly slow, but no idea how to do a more efficient join query in Mongo
      const user = await Users.findOne(post.userId, {}, { displayName: 1, email: 1 })
      if (!user) throw Error(`Can't find user for post: ${post._id}`)
      let tags = [] as Array<string>
      if (post.tagRelevance) {
        const tagIds = (Object.entries(post.tagRelevance) as Array<[string, number]>)
          .filter(([_, relevanceScore]) => relevanceScore > 0)
          .map(([tagId]) => tagId)
        const tagsResult = await Tags.find({ _id: { $in: tagIds } }, { projection: { name: 1 } }).fetch()
        tags = tagsResult.map(({ name }) => name)
      }
      
      const postUrl = siteUrlSetting.get()
      const row = {
        display_name: user.displayName,
        id: post._id,
        user_id: post.userId,
        title: post.title,
        slug: post.slug,
        karma: post.baseScore,
        tags: tags.sort().join(', '),
        frontpage_date: post.frontpageDate,
        posted_at: post.postedAt,
        created_at: post.createdAt,
        url: `${postUrl}/posts/${post._id}/${post.slug}`
      }
      rows.push(row)
      c++
      //eslint-disable-next-line no-console
      if (c % 20 === 0) console.log(`Post Details: Processed ${c}/${count} posts (${Math.round(c / count * 100)}%)`)
    }
    const csvFile = Papa.unparse(rows)
    const filePath = path.join(outputDir,`${path.basename(outputFile)}.csv`)
    fs.writeFileSync(filePath, csvFile, "utf-8")
    //eslint-disable-next-line no-console
    console.log(`Wrote details for ${rows.length} posts to ${filePath}`)
  }
)

export const exportLowKarma = async (
  {outputFilepath, karma = LOW_KARMA_THRESHOLD}: {outputFilepath: string, karma?: number}
) => {
  await exportPostDetails({
    selector: makeLowKarmaSelector(karma),
    outputFile: path.basename(outputFilepath),
    outputDir: path.dirname(outputFilepath)
  })
}

export const exportPostDetailsByMonth = async ({month, outputDir, outputFile}: AnyBecauseTodo) => {
  const lastMonth = moment.utc(month, 'YYYY-MM').startOf('month')
  outputFile = outputFile || `post_details_${lastMonth.format('YYYY-MM')}`
  //eslint-disable-next-line no-console
  console.log(`Exporting all posts from ${lastMonth.format('MMM YYYY')}`)
  return await exportPostDetails({
    selector: {
      createdAt: {
        $gte: lastMonth.toDate(), // first of prev month
        $lte: moment.utc(lastMonth).endOf('month').toDate()
      }
    },
    outputFile,
    outputDir
  })
}
