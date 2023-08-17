import cheerio from 'cheerio';
import cloudinary from 'cloudinary';
import makepub from 'nodepub';
import sanitizeHtml from 'sanitize-html';
import Sequences from '../../lib/collections/sequences/collection';
import { createAdminContext, getSiteUrl, slugify } from '../vulcan-lib';
import { sequenceGetAllPosts } from '../../lib/collections/sequences/helpers';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import Chapters from '../../lib/collections/chapters/collection';
import Users from '../../lib/collections/users/collection';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { cloudinaryApiKey, cloudinaryApiSecret } from '../scripts/convertImagesToCloudinary';
import { makeCloudinaryImageUrl } from '../../components/common/CloudinaryImage2';
import fs from 'fs';
import https from 'https'
import { namedToNumericEntities } from './entityConvert';

const getConfigFromSequence = (sequence: DbSequence, author: DbUser, imagePath: string) => {
  return {
      id: slugify(sequence.title),
      title: sequence.title,
      cover: imagePath,
      series: siteNameWithArticleSetting.get(),
      sequence: 1,
      author: author.displayName,
      fileAs: author.displayName,
      // TODO come back to
      // genre: "Non-Fiction",
      // tags: "Rationality",
      // copyright: `${author.displayName}, `, "Scott Alexander, 2017",
      publisher: siteNameWithArticleSetting.get(),
      // published: "2017",
      language: "en",
      description: "",
      contents: "Chapters",
      source: getSiteUrl(),
      images: ['']
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

// TODO make more generic
function downloadImageFile(url, outFile): Promise<void> {
  const file = fs.createWriteStream(outFile)
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", async () => {
        resolve()
      })
      file.on("error",  async () => {
        reject()
      });
    })
  })
}

async function buildLocalEbookFromSequence(sequence: DbSequence, coverPath: string): Promise<string> {
  const context = await createAdminContext();
  const posts = await sequenceGetAllPosts(sequence._id, context)
  const chapters = await Chapters.find({sequenceId: sequence._id}).fetch()
  const author = await Users.findOne({_id: sequence.userId})

  if (!author) throw Error("No author found")

  const config = getConfigFromSequence(sequence, author, coverPath)
  let epub = makepub.document(config);

  epub.addSection('Title Page', "<h1>[[TITLE]]</h1><h3>by [[AUTHOR]]</h3>", true, true);
  
  function buildEbookFromSequence(sequence, chapters, posts) {
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

  function getImagesFromDocument(document) {
    const contents = document.contents?.html || ''
    const images = getImagesFromString(contents)
    images.forEach(async image => {
      await downloadImageFile(image, `tmp/${image}`)
    })
    return images
  }
  
  function getImagesFromString(string) {
    const imgRex = /<img.*?src="(.*?)"[^>]+>/g;
    const images = [];
      let img;
      while ((img = imgRex.exec(string))) {
         images.push(img[1]);
      }
    return images;
  }

  async function createDocFromLWContents(title, document) {
    let newDoc = cheerio.load(htmlTemplate)
    let contents = document.contents?.html || ''

    Object.keys(namedToNumericEntities).forEach((key, i) => {
      var re = new RegExp(key,"g");
      contents = contents.replace(re, namedToNumericEntities[key])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err)
      }
    })
    if (document.title) {
      let safe_title = document.title.toLowerCase().replace(/ /g, '-');
      newDoc('body').append('<div id="'+safe_title+'"></div>');
      newDoc('div').append('<h1>'+document.title+'</h1>')
    }
    const images = getImagesFromString(contents)
    images.forEach(async image => {
      await downloadImageFile(image, `tmp/${image}`)
    })
    console.log(images)
    newDoc('div').append(contents)
    epub.addSection(title, sanitizeHtml(newDoc('body').html() || '', {parser: {xmlMode: true}}))
  }

  buildEbookFromSequence(sequence, chapters, posts)

  const outFolder = "tmp/"
  const outFilename = `${slugify(sequence.title)}`
  const outFile = `${outFolder}${outFilename}.epub`
  await epub.writeEPUB(outFolder, outFilename)

  return outFile
}

export async function ChaptersEditEbookCallback (chapter: DbChapter) {
  console.log("BEGIN ChaptersEditEbookCallback")
  const sequence = await Sequences.findOne({_id: chapter.sequenceId})

  if (!sequence) throw Error("No sequence found")

  const coverImagePath = `tmp/${sequence._id}_cover.jpg`
  const imageUrl = makeCloudinaryImageUrl(sequence.bannerImageId, {f:'jpg'})
  await downloadImageFile(imageUrl, coverImagePath)

  const localEbookFile = await buildLocalEbookFromSequence(sequence, coverImagePath)

  const result = await cloudinary.v2.uploader.upload(
    localEbookFile,
    {
      public_id: `${slugify(sequence.title)}`,
      folder: `ebooks`,
      cloud_name: cloudinaryCloudNameSetting.get(),
      api_key: cloudinaryApiKey.get(),
      api_secret:  cloudinaryApiSecret.get(),
      resource_type: "raw"
    }
  );
  console.log(result.url) 


   
  // see more options at https://manual.calibre-ebook.com/generated/en/ebook-convert.html
  // var options = {
  //   input: path.join(localEbookFile),
  //   output: path.join(`${localEbookFile}.mobi`),
  //   authors: '"Seth Vincent"',
  //   pageBreaksBefore: '//h:h1',
  //   chapter: '//h:h1',
  //   insertBlankLine: true,
  //   insertBlankLineSize: '1',
  //   lineHeight: '12',
  //   marginTop: '50',
  //   marginRight: '50',
  //   marginBottom: '50',
  //   marginLeft: '50'
  // }
   
  // /*
  // * create epub file
  // */
  // convert(options, function (err) {
  //   if (err) console.log(err)
  // })

}