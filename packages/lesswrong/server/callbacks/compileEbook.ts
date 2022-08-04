import cheerio from 'cheerio';
import cloudinary from 'cloudinary';
import makepub from 'nodepub';
import jetpack from 'fs-jetpack';
import { request } from 'graphql-request';
import { execSync } from 'child_process';
import sanitizeHtml from 'sanitize-html';
import Sequences from '../../lib/collections/sequences/collection';
import { createAdminContext, getSiteUrl } from '../vulcan-lib';
import { sequenceGetAllPosts } from '../../lib/collections/sequences/helpers';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import Chapters from '../../lib/collections/chapters/collection';
import Users from '../../lib/collections/users/collection';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { DatabaseServerSetting } from '../databaseSettings';
import { cloudinaryApiKey, cloudinaryApiSecret } from '../scripts/convertImagesToCloudinary';

// export async function _ChaptersEditEbookCallback (chapter: DbChapter) {
  
//   var version = process.argv.length > 2 ? process.argv[2] : 'default';
  
//   const config = JSON.parse(jetpack.read('meta/' + version + '.json'));
  
//   var scrapeError = false;
  
//   var epub = makepub.document(config.metadata, config.img);
  
//   epub.addCSS(jetpack.read('style/base.css'));
  
//   epub.addSection('Title Page', "<h1>[[TITLE]]</h1><h3>by [[AUTHOR]]</h3>", true, true);
  
//   var base_content = jetpack.read('template.xhtml');
  
//   function addChapterToBook(html, url, cache_path){
//     let $ = cheerio.load(html);
//     let title = $(config.titleSelector).first().text();
//     let content = $(config.contentSelector).html();
//     if(config.withoutSelector) $(config.withoutSelector).remove();
//     let path = url;
//     if(typeof url === 'object'){
//       path = url.url;
//       if(url.titleSelector) title = $(url.titleSelector).text();
//       if(url.contentSelector) content = $(url.contentSelector).text();
//     }
//     if(title === ''){
//       console.log('Couldn\'t correctly scrape', path);
//       jetpack.remove(cache_path);
//       scrapeError = true;
//     }
//     let safe_title = title.toLowerCase().replace(/ /g, '-');
//     let newDoc = cheerio.load(base_content);
//     newDoc('body').append('<div id="'+safe_title+'"></div>');
//     newDoc('div').append('<h1>'+title+'</h1>').append(content);
//     epub.addSection(title, newDoc('body').html());
//   }
  
//   function buildEbookFromCollection(collection) {
//     console.log("buildEbookFromCollection", collection);
//     collection.books.forEach((book, bookCount) => {
//       const bookDoc = createDocFromLWContents(book.title || bookCount, book)
//       book.posts && book.posts.forEach((post, bookPostCount) => {
//         createDocFromLWContents(post.title || `${bookCount}.posts.${bookPostCount}`, post)
//       })
//       book.sequences && book.sequences.forEach(sequence => {
//         buildEbookFromSequence(sequence)
//       })
//     })
//   }
  
//   function buildEbookFromSequence(sequence) {
//     createDocFromLWContents(sequence.title, sequence)
//     sequence.chapters && sequence.chapters.forEach((chapter) => {
//       if (chapter.title) {
//         createDocFromLWContents(chapter.title, chapter)
//       }
//       chapter.posts && chapter.posts.forEach((post, postCount) => {
//         createDocFromLWContents(post.title, post)
//       })
//     })
//   }
  
//   function createDocFromLWContents(title, content) {
//     let newDoc = cheerio.load(base_content)
//     if (content.title) {
//       let safe_title = content.title.toLowerCase().replace(/ /g, '-');
//       newDoc('body').append('<div id="'+safe_title+'"></div>');
//       newDoc('div').append('<h1>'+content.title+'</h1>')
//     }
//     newDoc('div').append(content?.contents?.html || '')
//     epub.addSection(title, sanitizeHtml(newDoc('body').html(), {parser: {xmlMode: true}}))
//   }
  
//   if (config.urls) {
//     config.urls.forEach(url => {
//       let path, cache_path;
//       if(typeof url === 'string'){
//         path = url;
//       } else {
//         path = url.url;
//       }
//       let stem = path.trim().split('/').pop();
//       cache_path = './cache/' + stem + (stem.split('.').pop() !== 'html' ? '.html' : '');
//       if(!jetpack.exists(cache_path)){
//         console.log('Scraping', config.metadata.source + path);
//         execSync('wget ' + config.metadata.source + path + ' -nc -q -O ' + cache_path);
//       }
//       addChapterToBook(jetpack.read(cache_path), url, cache_path);
//     });
//     if(scrapeError){
//       console.log('Scrape errors occurred: No book produced.');
//     } else {
//       epub.writeEPUB(console.error, 'output', config.shorttitle, ()=>{
//         console.log('Book successfully written to output/' + config.shorttitle + '.epub');
//       });
//     }
//   } else if (config.collectionId) {
//     const query = `{
//       collection(input: {selector: {_id: "${config.collectionId}"}}) {
//         result {
//           books {
//             title
//             contents { 
//               html
//             }
//             sequences {
//               title
//               contents {
//                 html
//               }
//               _id
//               chapters {
//                 title
//                 contents {
//                   html
//                 }
//                 posts {
//                   title
//                   contents {
//                     html
//                   }
//                   _id
//                 }
//               }
//             }
//           }
//         }
//       }
//     }`
//     request('https://www.lessestwrong.com/graphql?', query)
//       .then(data => {
//         buildEbookFromCollection(data.collection.result)
//         epub.writeEPUB(console.error, 'output', config.shorttitle, ()=>{
//           console.log('Book successfully written to output/' + config.shorttitle + '.epub');
//         });
//       })
//       .catch(err => {
//         console.log(err)
//       })  
//   } else if (config.sequenceId) {
//     const query = `{
//       sequence(input: {selector: {_id: "${config.sequenceId}"}}) {
//         result {
//           title
//             contents {
//               html
//             }
//             chapters {
//               title
//               contents {
//                 html
//               }
//               posts {
//                 title
//                 contents {
//                   html
//                 }
//                 _id
//               }
//             }
//         }
//       }
//     }
//     `
//     request('https://www.lessestwrong.com/graphql?', query)
//       .then(data => {
//         buildEbookFromSequence(data.sequence.result)
//         epub.writeEPUB(console.error, 'output', config.shorttitle, ()=>{
//           console.log('Book successfully written to output/' + config.shorttitle + '.epub');
//         });
//       })
//       .catch(err => {
//         console.log(err)
//       })  
//   }
// }

const getConfigFromSequence = (sequence: DbSequence, author: DbUser) => {
  return {
    img: "images/codex.jpg",
    shorttitle: sequence.title,
    metadata: {
      id: sequence._id,
      title: sequence.title,
      cover: "/Users/wh/Documents/code/ForumMagnum/public/gatherTownIconMuted.png",
      series: siteNameWithArticleSetting.get(),
      sequence: 1,
      author: author.displayName,
      fileAs: author.displayName,
      // TODO come back to
      // genre: "Non-Fiction",
      // tags: "Rationality",
      // copyright: "Scott Alexander, 2017",
      publisher: siteNameWithArticleSetting.get(),
      // published: "2017",
      language: "en",
      description: "",
      contents: "Chapters",
      source: getSiteUrl(),
      images: []
    },
    titleSelector: "h1.PostsPageTitle-root",
    contentSelector: "div.PostsPage-postContent",
  }
}

const htmlTemplate = `
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
    <link rel="stylesheet" href="style/base.css" />
  </head>
<body></body>
</html>
`

export async function ChaptersEditEbookCallback (chapter: DbChapter) {
  console.log("BEGIN ChaptersEditEbookCallback")
  const context = await createAdminContext();
  const posts = await sequenceGetAllPosts(chapter.sequenceId, context)
  const chapters = await Chapters.find({sequenceId: chapter.sequenceId}).fetch()
  const sequence = await Sequences.findOne({_id: chapter.sequenceId})
  const author = await Users.findOne({_id: sequence?.userId})

  // get cover image

  
  console.log(sequence)
  const config = getConfigFromSequence(sequence, author)
  let epub = makepub.document(config.metadata);

  // epub.addCSS(jetpack.read('style/base.css')); 
  epub.addSection('Title Page', "<h1>[[TITLE]]</h1><h3>by [[AUTHOR]]</h3>", true, true);
  
  function buildEbookFromSequence(sequence, chapters, posts, author) {
    // 
    createDocFromLWContents(sequence.title, sequence)
    for (let chapter of chapters) {
      if (chapter.title) {
        createDocFromLWContents(chapter.title, chapter)
      }
      for (let post of posts) {
        createDocFromLWContents(post.title, post)
      }
    }
  }
  
  function createDocFromLWContents(title, document) {
    let newDoc = cheerio.load(htmlTemplate)
    if (document.title) {
      let safe_title = document.title.toLowerCase().replace(/ /g, '-');
      newDoc('body').append('<div id="'+safe_title+'"></div>');
      newDoc('div').append('<h1>'+document.title+'</h1>')
    }
    newDoc('div').append(document?.contents?.html || '')
    epub.addSection(title, sanitizeHtml(newDoc('body').html() || '', {parser: {xmlMode: true}}))
  }

  buildEbookFromSequence(sequence, chapters, posts, author)

  const outFolder = "/Users/wh/Documents/code/ForumMagnum/test_ebook"
  const outFile = "/Users/wh/Documents/code/ForumMagnum/test_ebook/test_ebook.epub"
  epub.writeEPUB(outFolder, "test_ebook")

  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();

  const result = await cloudinary.v2.uploader.upload(
    outFile,
    {
      folder: `test_ebook/${sequence?._id}`,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    }
  );
  console.log("end of thing")
  console.log(result)
  console.log(result.url)
}