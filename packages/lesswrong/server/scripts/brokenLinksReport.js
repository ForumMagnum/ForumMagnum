/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import Users from 'meteor/vulcan:users';
import htmlparser2 from 'htmlparser2';
import { HTTP } from 'meteor/http';
import { URL } from 'url';
import fs from 'fs';

const whitelistedImageHosts = [
  "lesswrong.com",
  "www.lesswrong.com",
  "res.cloudinary.com"
];
const baseUrl = "http://www.lesswrong.com";

// Parse an HTML string and return an array of URLs of images it refers to in
// <img> tags.
function getImagesInHtml(html)
{
  let images = [];
  
  let parser = new htmlparser2.Parser({
    onopentag: function(name, attribs) {
      if(name.toLowerCase() === 'img' && attribs.src) {
        images.push(attribs.src);
      }
    }
  });
  parser.write(html);
  parser.end();
  
  return images;
}

// Parse an HTML string and return an array of URLs that it links to in <a>
// tags.
function getLinksInHtml(html)
{
  let links = [];
  
  let parser = new htmlparser2.Parser({
    onopentag: function(name, attribs) {
      if(name.toLowerCase() === 'a' && attribs.href) {
        links.push(attribs.href);
      }
    }
  });
  parser.write(html);
  parser.end();
  
  return links;
}

async function urlIsBroken(url)
{
  try {
    let absoluteUrl = new URL(url, baseUrl).toString();
    let result = HTTP.call('GET', absoluteUrl, {timeout: 5000});
    if (result.statusCode >= 300 && result.statusCode <= 399) {
      // Redirect. In principle this shouldn't happen because meteor's HTTP.call
      // is documented to follow redirects by default. But maybe it does happen.
      //eslint-disable-next-line no-console
      console.log("Got "+result.statusCode+" redirect on "+absoluteUrl);
      return false;
    } else if (result.statusCode !== 200) {
      return true;
    } else {
      return false;
    }
  } catch(e) {
    return true;
  }
}

function imageIsOffsite(imageUrl)
{
  const hostname = new URL(imageUrl, baseUrl).hostname;
  
  for(let i=0; i<whitelistedImageHosts.length; i++) {
    if(hostname === whitelistedImageHosts[i])
      return false;
  }
  
  return true;
}

const describePost = async (post) =>
{
  const author = await Users.findOne({_id: post.userId});
  const postLink = baseUrl + "/posts/"+post._id;
  return `${post.title} by ${author.displayName} [${post.baseScore}]\n    ${postLink}`;
}

// Check a post for broken images, broken links, and offsite images, and return
// a human-readable string describing the outcome. If everything is good
// (nothing broken), returns the empty string; otherwise the result (which is
// meant to be handled by a person) includes the title/author/karma of the
// post and a list of broken things within it.
const checkPost = async (post) => {
  const { html = "" } = post.contents || {}
  const images = getImagesInHtml(html);
  const links = getLinksInHtml(html);
  
  let brokenImages = [];
  let offsiteImages = [];
  let brokenLinks = [];
  
  for(let i=0; i<images.length; i++) {
    let imageUrl = images[i];
    if(await urlIsBroken(imageUrl))
      brokenImages.push(imageUrl);
    else if(imageIsOffsite(imageUrl))
      offsiteImages.push(imageUrl);
  }
  for(let i=0; i<links.length; i++) {
    let linkUrl = links[i];
    if(await urlIsBroken(linkUrl))
      brokenLinks.push(linkUrl);
  }
  
  if(brokenImages.length>0 || offsiteImages.length>0 || brokenLinks.length>0)
  {
    let sb = [];
    sb.push(await describePost(post)+"\n");
    for(let i=0; i<brokenImages.length; i++)
      sb.push(`    Broken image: ${brokenImages[i]}\n`);
    for(let i=0; i<brokenLinks.length; i++)
      sb.push(`    Broken link: ${brokenLinks[i]}\n`);
    for(let i=0; i<offsiteImages.length; i++)
      sb.push(`    Offsite image: ${offsiteImages[i]}\n`);
    return sb.join("");
  }
  else
  {
    return null;
  }
};

Vulcan.findBrokenLinks = async (
  startDate, endDate,
  output
) => {
  // TODO: Subdivide date range so we don't try to load all posts at once
  // TODO: Retry "broken" links to remove false positives from the list
  let write = null;
  let onFinish = null;
  
  if (!output) {
    //eslint-disable-next-line no-console
    write = console.log;
  } else if(_.isString(output)) {
    let outputFile = fs.openSync(output, "a");
    write = (str) => fs.writeSync(outputFile, str);
    onFinish = () => fs.closeSync(outputFile);
  } else {
    write = output;
  }
  
  write("Checking posts for broken links and images.\n");
  let filter = {};
  if(startDate || endDate) {
    filter = {postedAt: {
      $gte: startDate,
      $lte: endDate
    }};
  }
  const postsToCheck = await Posts.find(filter).fetch();
  
  write("Checking "+postsToCheck.length+" post for broken links and images.\n");
  for(let i=0; i<postsToCheck.length; i++)
  {
    let post = postsToCheck[i];
    let result = await checkPost(post);
    if (result) {
      write(result);
    }
  }
  write("Checked "+postsToCheck.length+" post for broken links and images.\n");
  
  if(onFinish) onFinish();
}
