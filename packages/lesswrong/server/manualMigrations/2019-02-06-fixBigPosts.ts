import { registerMigration, migrateDocuments } from './migrationUtils';
import { draftJSToHtmlWithLatex, markdownToHtml} from '../editor/conversionUtils'
import { Posts } from '../../server/collections/posts/collection'
import { updateMutator } from '../vulcan-lib/mutators';

export default registerMigration({
  name: "fixBigPosts",
  dateWritten: "2019-02-06",
  idempotent: true,
  action: async () => {
    await migrateDocuments({
      description: `Fix the posts that are really big`,
      collection: Posts,
      batchSize: 1000,
      unmigratedDocumentQuery: {
        $where: '(this.htmlBody && this.htmlBody.length) > 3000000'
      }, 
      migrate: async (documents: Array<any>) => {
        for (const doc of documents) {
          const { body, content, htmlBody } = doc
          let newHtml
          if (content) {
            newHtml = await draftJSToHtmlWithLatex(content)
          } else if (body) {
            newHtml = await markdownToHtml(body)
          } else {
            newHtml = htmlBody
          }
          
          await updateMutator({
            collection: Posts,
            documentId: doc._id,
            set: {
              htmlBody: newHtml
            } as any, // Suppress type error because old migration uses an old schema
            validate: false
          });
        }
      }
    })  
  },
});
