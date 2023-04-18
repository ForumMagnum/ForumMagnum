import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Posts from '../../lib/collections/posts/collection';
import Comments from '../../lib/collections/comments/collection';
import { cheerioParse } from '../utils/htmlUtil';

const tryToFixUrl = (oldUrl: string, newUrl: string) => {
  try {
    // Only return the edited version if this actually fixed the problem
    new URL(newUrl);
    return newUrl;
  } catch (e) {
    return oldUrl;
  }
}

const prependMailTo = (url: string) => tryToFixUrl(url, `mailto:${url}`);
const prependHttps = (url: string) => tryToFixUrl(url, `https://${url}`);

const validateUrl = (url: string) => {
  try {
    // This will validate the URL - importantly, it will fail if the protocol is missing
    new URL(url);
  } catch (e) {
    if (url.search(/[^@]+@[^.]+\.[^\n\r\f]+$/) === 0) {
      // Add mailto: to email addresses
      return prependMailTo(url);
    } else if (url.search(/\/.*/) === 0) {
      // This is probably _meant_ to be relative. We could prepend the siteUrl from
      // instanceSettings, but this seems unnecessarily risky - let's just do nothing.
    } else if (url.search(/^((?!http).)*$/) === 0) {
      // Add https:// to anything else
      return prependHttps(url);
    }
  }

  return url;
}

const updateCollection = async (collection: AnyBecauseObsolete) => {
  await forEachDocumentBatchInCollection({
    collection,
    batchSize: 500,
    filter: {
      'contents.html': { $exists: true },
    },
    callback: async (documents: Array<DbPost|DbComment>) => {
      // eslint-disable-next-line no-console
      console.log(`Migrating ${collection.collectionName} batch`);

      const changes: any[] = [];
      for (const document of documents) {
        const { html } = document.contents;

        const $ = cheerioParse(html);
        let edited = false;

        $('a').each((i, link) => {
          // @ts-ignore TextElement doesn't have attribs - this doesn't matter here
          const { href } = link.attribs ?? {};
          if (href) {
            const newUrl = validateUrl(href);
            if (href !== newUrl) {
              edited = true;
              $(link).attr('href', newUrl);
            }
          }
        });

        if (edited) {
          changes.push({
            updateOne: {
              filter: { _id: document._id },
              update: { $set: { "contents.html": $.html() } }
            },
          });
        }
      }

      await collection.rawCollection().bulkWrite(changes, { ordered: false });
    }
  });
}

registerMigration({
  name: "makeRelativeUrlsAbsolute",
  dateWritten: "2022-07-19",
  idempotent: true,
  action: async () => {
    await updateCollection(Posts);
    await updateCollection(Comments);
  },
});
