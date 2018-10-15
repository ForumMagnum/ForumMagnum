/* global Vulcan */
import { Posts } from '../../lib/collections/posts'
import Users from 'meteor/vulcan:users';
import { Utils } from 'meteor/vulcan:core';
import htmlparser2 from 'htmlparser2';
import { HTTP } from 'meteor/http';
import url from 'url';

const whitelistedImageHosts = [
  "lesswrong.com",
  "www.lesswrong.com",
  "res.cloudinary.com"
];

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
    let result = HTTP.call('GET', url, {timeout: 5000});
    if (result.statusCode !== 200) {
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
  const hostname = new url.URL(imageUrl).hostname;
  
  for(let i=0; i<whitelistedImageHosts.length; i++) {
    if(hostname === whitelistedImageHosts[i])
      return false;
  }
  
  return true;
}

const describePost = async (post) =>
{
  const author = await Users.findOne({_id: post.userId});
  const postLink = Utils.getSiteUrl() + "posts/"+post._id;
  return `${post.title} by ${author.displayName} [${post.baseScore}]\n    ${postLink}`;
}

// Check a post for broken images, broken links, and offsite images, and return
// a human-readable string describing the outcome. If everything is good
// (nothing broken), returns the empty string; otherwise the result (which is
// meant to be handled by a person) includes the title/author/karma of the
// post and a list of broken things within it.
const checkPost = async (post) => {
  const images = getImagesInHtml(post.htmlBody);
  const links = getLinksInHtml(post.htmlBody);
  
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
  
  let sb = [];
  if(brokenImages.length>0 || offsiteImages.length>0 || brokenLinks.length>0)
  {
    sb.push(await describePost(post)+"\n");
    for(let i=0; i<brokenImages.length; i++)
      sb.push(`    Broken image: ${brokenImages[i]}\n`);
    for(let i=0; i<brokenLinks.length; i++)
      sb.push(`    Broken link: ${brokenLinks[i]}\n`);
    for(let i=0; i<offsiteImages.length; i++)
      sb.push(`    Offsite image: ${offsiteImages[i]}\n`);
  }
  return sb.join("");
};

Vulcan.findBrokenLinks = async () => {
  //eslint-disable-next-line no-console
  console.log("Checking all posts for broken links and images.");
  
  const postsToCheck = await Posts.find().fetch();
  
  //eslint-disable-next-line no-console
  console.log("Checking "+postsToCheck.length+" post for broken links and images.");
  for(let i=0; i<postsToCheck.length; i++)
  {
    let post = postsToCheck[i];
    let result = await checkPost(post);
    //eslint-disable-next-line no-console
    console.log(result);
  }
  //eslint-disable-next-line no-console
  console.log("Checked "+postsToCheck.length+" post for broken links and images.");
}