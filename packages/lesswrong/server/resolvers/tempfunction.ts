import cheerio from 'cheerio';
import { cheerioParse } from '../utils/htmlUtil';
import {onStartup} from '../../lib/executionEnvironment';
import { Globals } from '../../lib/vulcan-lib/config';



export const getDebateResponseCount = () => {

  const dummyHtml = `
  <block blockId="ireiha-83484r7">
    <p>Following the success of the&nbsp; <a href="http://www.lesswrong.com/sequences/n945eovrA3oDueqtq">2021 MIRI
        Conversations</a> in drawing out various people's views on key questions in AI and digging into their disagreements,
      the LessWrong team was inspired to build a more dedicated feature for hosting debates on LessWrong.</p>
    <p>The MIRI conversations were mostly hosted on Discord and then via a laborious process shoehorned into the LessWrong
      editor. We figured it wouldn't be hard to do better. Among many benefits, the debates can be held on LessWrong itself;
      readers are able to comment "inline" on responses within the debate; and there will be customized "debate item" in
      the Latest Posts list on the frontpage that signals that 1) it's a debate, and 2) how many debate responses have been
      posted since you last viewed the debate. Hopefully all of this is intuitive from the UI.&nbsp;</p>
  </block>

  <block blockId="iasdvphiue264r7">
    <p>The feature is designed so that debates can be held in private, possibly edited, and then published publicly. Or that
      the debate happens live on the site, allowing for live commenting.&nbsp;</p>
    <p>As we're rolling out the feature, we'll initially just set up a few debates that we'd like to see, and then later
      potentially open up the feature to users more broadly. You're welcome to contact us [link] or comment here if you're
      interested in viewing or participating in a particular debate.&nbsp;</p>
    <hr>
    <p><strong>This announcement post will also serve as the Inaugural Debate using the new debate feature.</strong> We were
      lucky to find two willing participants on short notice, so big thanks to them. GPT-4 and Claude+ are going to discuss
      whether or not AI Safety via Debate is a promising Alignment strategy.</p>
    <p><br>&nbsp;</p>
  </block>
  <block>
    <p>test block without any id</p>
  </block>
  `


  // Load the HTML string into cheerio
const $ = cheerioParse(dummyHtml);

// Select all 'block' elements with a 'blockId' attribute
const blocksWithId = $('block[blockId]');
const ids : string[] = blocksWithId.map( (i, block) => $(block).attr('blockid')).get();

console.log("List of ids:", ids)

return ids;

}

const getDialogueMessageTimestamps = () => {
  // if (!post.debate) return [];


  //console.log("html:", html)
  const dummyHtml = `
  <block message-id="ireiha-83484r7" submitted-at="2023-10-04T13:00:00.000Z">
    <p>Following the success of the&nbsp; <a href="http://www.lesswrong.com/sequences/n945eovrA3oDueqtq">2021 MIRI
        Conversations</a> in drawing out various people's views on key questions in AI and digging into their disagreements,
      the LessWrong team was inspired to build a more dedicated feature for hosting debates on LessWrong.</p>
    <p>The MIRI conversations were mostly hosted on Discord and then via a laborious process shoehorned into the LessWrong
      editor. We figured it wouldn't be hard to do better. Among many benefits, the debates can be held on LessWrong itself;
      readers are able to comment "inline" on responses within the debate; and there will be customized "debate item" in
      the Latest Posts list on the frontpage that signals that 1) it's a debate, and 2) how many debate responses have been
      posted since you last viewed the debate. Hopefully all of this is intuitive from the UI.&nbsp;</p>
  </block>

  <block message-id="iasdvphiue264r7 submitted-at=""2023-10-02T13:10:00.000Z"">
    <p>The feature is designed so that debates can be held in private, possibly edited, and then published publicly. Or that
      the debate happens live on the site, allowing for live commenting.&nbsp;</p>
    <p>As we're rolling out the feature, we'll initially just set up a few debates that we'd like to see, and then later
      potentially open up the feature to users more broadly. You're welcome to contact us [link] or comment here if you're
      interested in viewing or participating in a particular debate.&nbsp;</p>
    <hr>
    <p><strong>This announcement post will also serve as the Inaugural Debate using the new debate feature.</strong> We were
      lucky to find two willing participants on short notice, so big thanks to them. GPT-4 and Claude+ are going to discuss
      whether or not AI Safety via Debate is a promising Alignment strategy.</p>
    <p><br>&nbsp;</p>
  </block>
  <block>
    <p>test block without any id</p>
  </block>
  `

  // Load the HTML string into cheerio
  const parsedHtml = cheerioParse(dummyHtml);

  // Select all 'block' elements with a 'message-id' attribute
  const blocksWithId = parsedHtml('block[message-id]');
  const timestamps: string[] = blocksWithId.map( (i, block) => $(block).attr('submitted-at')).get();

  console.log({timestamps})

  return timestamps;
}

Globals.getDebateResponseCount = getDebateResponseCount

Globals.getDialogueMessageTimestamps = getDialogueMessageTimestamps
