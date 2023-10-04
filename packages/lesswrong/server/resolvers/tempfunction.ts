import cheerio from 'cheerio';
import { cheerioParse } from '../utils/htmlUtil';
import {onStartup} from '../../lib/executionEnvironment';
import { Globals } from '../../lib/vulcan-lib/config';
import {dummyHtml} from '../repos/PostsRepo';



export const getDebateResponseCount = () => {
  const html = dummyHtml // post.contents.originalContents.data;
 
  // Load the HTML string into cheerio
const parsedHtml = cheerioParse(dummyHtml);

// Select all 'block' elements with a 'blockId' attribute
const blocksWithId = parsedHtml('block[blockId]');
const ids : string[] = blocksWithId.map( (i, block) => $(block).attr('blockid')).get();

console.log("List of ids:", ids)

return ids;

}

const getDialogueMessageTimestamps = (post: DbPost): Date[] => {
  const html = dummyHtml // post.contents.originalContents.data;
  const parsedHtml= cheerioParse(html);


  // Select all 'block' elements with a 'blockId' attribute
  const blocksWithId = parsedHtml('block[message-id]');
  const timestampStrings = blocksWithId.map( (i, block) => (parsedHtml(block).attr('submitted-at'))).get();
  const timestamps = timestampStrings.map( dateString => new Date(dateString))
  
  return timestamps
  
}

Globals.getDebateResponseCount = getDebateResponseCount

Globals.getDialogueMessageTimestamps = getDialogueMessageTimestamps
