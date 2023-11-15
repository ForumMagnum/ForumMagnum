/* eslint-disable no-console */
import { Vulcan } from '../../vulcan-lib';
import { wrapVulcanAsyncScript } from '../utils';
import * as _ from 'underscore';
import Posts from '../../../lib/collections/posts/collection';
import { generateDallePreviewImg } from '../../languageModels/dallePreviewImg';

/**
 * This was written for the EA Forum to test out having GPT-4 and DALLE 3 generate preview images for posts.
 */
Vulcan.testDalle = wrapVulcanAsyncScript(
  'testDalle',
  async () => {
    const posts = await Posts.find({
      frontpageDate: {$exists: true},
      draft: {$ne: true},
      deletedDraft: {$ne: true}
    }, {sort: {frontpageDate: -1}, limit: 1}).fetch()
  
    for (const post of posts) {
      await generateDallePreviewImg({
        title: post.title,
        contentType: post.contents.originalContents.type,
        body: post.contents.originalContents.data,
        _id: post._id
      })
    }
  }
)
