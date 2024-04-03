import Posts from '../../lib/collections/posts/collection';
import { parseDocumentFromString } from '../../lib/domParser';
import { extractTableOfContents as extractTableOfContentsNew } from '../../lib/tableOfContents';
import { extractTableOfContents as extractTableOfContentsOld } from '../tableOfContentsOld';
import { Globals } from '../vulcan-lib';

const regressions = [
  `<p><i><strong>Bold and italic</strong></i></p>`,
  // There used to be a difference here in how trim() was used
  `<p><strong id="Daniel_Filan___23_544____Funding_to_produce_12_more_AXRP_episodes__the_AI_X_risk_Podcast__">Daniel
  Filan ($23,544):&nbsp; Funding to produce 12 more AXRP episodes, the AI X-risk Podcast.&nbsp;</strong></p>`,
  // `<p><strong>Here is some additional content (</strong><a href="https://www.youtube.com/watch?v=S7Cu59G1aSQ&amp;t=76s"><strong>11 min video</strong></a><strong>) to consider about if you are the right fit for founding.</strong></p>`
]

// Heading in old, not in new:
// <p><a href=\"https://www.visitdubai.com/en/plan-your-trip/visa-information\"><strong>Dubai Visa
//       Information</strong></a><br><br><strong>Why is it such short notice?</strong></p>

// Heading in old, not in new:
// <p><a
//     href=\"https://www.facebook.com/hashtag/eaupdiliman?__eep__=6&amp;__cft__[0]=AZXQjHuBPBImqZhxpk_ImEl_fH5PHQx_X2ubwg6M2C75KOXR7BEegBLzUjQhppANzhDpgvdtPKrJwq7vOIJXjiSBBgbL221mnLus6JZtyYcj2dtckQRiKmIMbLTuFMzo6aw&amp;__tn__=q\"><strong>#EAUPDiliman</strong></a><br><a
//     href=\"https://www.facebook.com/hashtag/eaphilippines?__eep__=6&amp;__cft__[0]=AZXQjHuBPBImqZhxpk_ImEl_fH5PHQx_X2ubwg6M2C75KOXR7BEegBLzUjQhppANzhDpgvdtPKrJwq7vOIJXjiSBBgbL221mnLus6JZtyYcj2dtckQRiKmIMbLTuFMzo6aw&amp;__tn__=q\"><strong>#EAPhilippines</strong></a><br><a
//     href=\"https://www.facebook.com/hashtag/effectivealtruism?__eep__=6&amp;__cft__[0]=AZXQjHuBPBImqZhxpk_ImEl_fH5PHQx_X2ubwg6M2C75KOXR7BEegBLzUjQhppANzhDpgvdtPKrJwq7vOIJXjiSBBgbL221mnLus6JZtyYcj2dtckQRiKmIMbLTuFMzo6aw&amp;__tn__=q\"><strong>#EffectiveAltruism</strong></a>
// </p>

// Heading in old, not in new:
// <blockquote>
//   <p><strong>Also Read: </strong><a
//       href=\"https://worlegram.com/read-blog/108231_learn-why-8gb-laptops-are-top-picks-in-the-market.html\"><strong>Learn
//         Why 8GB Laptops Are Top Picks in the Market</strong></a><br>&nbsp;</p>
// </blockquote>

// Heading in old, not in new:
// <p><br>&nbsp;<strong>Please submit your ideas here:&nbsp;</strong><a
//     href=\"https://docs.google.com/forms/d/e/1FAIpQLSf7yo1Bd4ZK6_u2nziuM_10bYYoJhAMjp-9b_MKG2tMX9PuWA/viewform\"><strong><u>Submit
//         your ideas</u></strong></a></p>
// <p>

const knownDifferences = [
  // Note: both the old and new versions got this one wrong (this should all be one header). Imo the new version is more correct though
  `<p><strong>Here is some additional content (</strong><a href="https://www.youtube.com/watch?v=S7Cu59G1aSQ&amp;t=76s"><strong>11 min video</strong></a><strong>) to consider about if you are the right fit for founding.</strong></p>`,
  '<p><strong>Animal advocacy organisations&nbsp;</strong><a href=\"https://www.animaladvocacycareers.org/post/animal-advocacy-bottlenecks\"><strong><u>listed</u></strong></a><strong> a lack of funding as the single most important thing that limited their organisations impact.</strong></p>',
  '<p><strong>&nbsp;</strong><a href=\"https://genericaura.com/product/careprost-eye-drops/\"><strong>Careprost</strong></a><strong> is an FDA-approved medicine that is used all over the world to reduce ocular blood pressure.&nbsp;</strong></p>',
  '<p><strong>Click Here To Know More Info:&nbsp;</strong><a href=\"https://www.osiztechnologies.com/ai-development-company\"><strong><u>https://www.osiztechnologies.com/ai-development-company</u></strong></a></p>',
  '<p><strong>Read More :-&nbsp;</strong><a href=\"https://getairlineshelpdesk.com/blog/united-airlines-flight-status\"><strong><u>United Airlines Flight Status</u></strong></a></p>'
]

function removeKnownDiscrepancies(html: string): string {
  const { document: htmlDoc, window: genericWindow } = parseDocumentFromString(html);

  // Select all paragraphs
  const paragraphs = htmlDoc.querySelectorAll('p');

  paragraphs.forEach(paragraph => {
    // Check if all text nodes within the paragraph are within <strong> tags
    const allTextStrong = Array.from(paragraph.childNodes).every(node => {
      // If the node is a text node, check if it's trimmed content is empty (meaning it's likely just whitespace)
      if (node.nodeType === genericWindow.Node.TEXT_NODE) {
        return !node.textContent?.trim();
      }
      // If the node is an element, check if it's a <strong> or if it contains a <strong>
      if (node.nodeType === genericWindow.Node.ELEMENT_NODE) {
        const element = node as Element;
        return element.tagName === 'STRONG' || element.querySelector('strong');
      }
      return false;
    });

    // Find all <strong> tags in the paragraph
    const strongTags = paragraph.querySelectorAll('strong');

    // Check if there are at least two <strong> tags at different levels of nesting
    let differentLevels = false;
    if (strongTags.length > 1) {
      const levels = new Set();
      strongTags.forEach(strong => {
        let level = 0;
        let parent = strong.parentNode;
        while (parent && parent !== paragraph) {
          level++;
          parent = parent.parentNode;
        }
        levels.add(level);
      });
      differentLevels = levels.size > 1;
    }

    // If all text is within <strong> tags but there are mixed children, remove the paragraph
    if (allTextStrong && differentLevels) {
      paragraph.remove();
    }
  });

  // Serialize the document back to a string
  return htmlDoc.body.innerHTML;
}

const knownFailingIds = [
    'Mm9qaEisqRmmoZbsX', // Correct, nested <strong> issue
    'dntYZ44ySurKAZjcz', // Correct, nested <strong> issue
    'oqWdF3pdZBTh4KCiG', // Correct, nested <strong> issue
    'RiktA3vY686ggFpaL', // Correct, nested <strong> issue
    'bFByG6qczuYWjrcnh', 'K2ZhSS4oMxZF6Pekr',
    'qe3z5Yfqr2ZoAvWe4', 'kPGqj8BMDzGpvFCCH', 'CcJsh4JcxEqYDaSte',
    'HeejJD2huPjn58WeN', 'qS6mfMv5phCWN8Zt6', 'aWr4rMf7ZhoCAtoMc',
    'kYihWpaBXcR9tarm6', 'mmsEAyvrrrQz5yE27', 'nrdJpxsFFrg5NgZBj',
    'icFeXbGWGhTPfZbbQ', 'ug3aE3rbwLaoQmWri', 'M6FCDYYxcmXkmx8kB',
    'KYDhBnbxsq2XT9G4g', 'Ap4H5ss9AA4pz8GLm', '8ZT5kkA8jufKpRFKA',
    'rzvieAMwsYWrQRHiB', 'jMAXETfapHYSBLfcF', 'uMChR2q6MzjrcovMN',
    'tAx63Rgtu28ksP4AT', '78JnLCuaBePEJ2H4v', '3K3ELn2HkqLeeKX6K',
    'dQBEM9piJbv4wR799', 'RMpNAigRM6pHop3Tv', 'Z7uodqDZzmw9PLdPs',
    'ejqZkDxzMHyizGZwW', 'cb8DfGKtC8rNNgjAf', 'qFZNXzgGna9jenWJh',
    'Zp6dbkzHnwm256Eof', 'ykYCLycLFzRj8b8aR', '6CHMky6dH5NWcXhwk',
    '2s7iekT9ujdwAxpJ7', 'QuCP7YaY8zna2jcoB', 'fAkMXofM3wx5A5B9L',
    'cjHGS3jYiezLcz6dh', 'sN66zSACBvigKw43t', 'eGNtn8Cgm7rsgbi2v',
    'zT6sQ9KcMhnXXDFwp', 'aQoxrCptP6GSP65nC', 'Yr54JMXC3rs2WWyqj',
    'DtkwXhnhw3s4ddang', 'E9Mugg6eEd2cNTPuC', 'D6xck9NdPaNKm47Nn',
    'EqdbKpoMz8vCEuZHj', 'S9bT84YGHCdkCSwY8', 'psDmebWf4tcYmYG86',
    'vQMdah3i7w4mavrgR', 'Dxw4WBZGxJ3rgRzE5', 'TCa5rh5cbESm6PnHE',
    'R8vGsHPJqZwF2FHRE', 'NSmTYu5C4YT5Xpx4b', 'NReo7YnvyLJYwRCzS',
    'nkefxjarSEFW2BkMu', '44yxoc6ASQh5WJLcA', 'YSz8JsCi3u7fupWHX',
    'M4vrdabyPDJ8PwbSk', 'MNPrXCsPpwTgygMxc', 'Pt5e8teMWZnsZ6G3Z',
    'XkGR9pemKPGQE4xiq', 'ZjT8kqPDJez5KhPPx', 'hpsbvjmZ7EYQozfHg',
    'DPJyt28ggzACZeMmo', 'tSCnGyP5wpSuEmRDQ', 'EKBt7uvYug7haDAfu',
    'QXbLkDPmB5AsMJ8F3', 'ikS2xRXkXgZNvHGK3', 'FuzoJwhPtaJTCkSzr',
    'FzMnnPxp6nA3gLuf2', 'Co9wY9E4NykXZWguj', 'JnKYarefDFDTBzJaz',
    'mH5Wq59rAqHCsjNEs', 'DEnpFdAvqX5S3fMtA', 'N638cECPG4uTppg6L',
    'WvPEitTCM8ueYPeeH', 'XmYpa5TPtN4aD4qqt', 'QWLwfqkLxuhaqh3fg',
    'px5BGvLSs8kiCrPjN', '53Ya4H2AsB43f9pZq', 'JEC6xhd9Ew5bnFXZ7',
    'kiW57dG2W8nyeitNu', 'Mfk8TRfrcub6RDRxH', 'hQtayqi3r6bo3EPoh',
    'r7cYRfiMGfcqsBxFg', 'b2Mb3xi9wviMKXrK5', 'yTu9pa9Po4hAuhETJ',
    'vPtTWkQFa3npqPwpy', 'icKdYwZjsvdKjJowD', 'TgdXtRvnQH85mswZQ',
    'aiNbxdzKC5fbi5mJF'
  ];

function testHtml(html: string) {
  const oldToC = extractTableOfContentsOld(html);
  const newToC = extractTableOfContentsNew(parseDocumentFromString(html));

  if (newToC?.html !== oldToC?.html) {
    throw new Error("html doesn't match");
  }

  if (newToC?.sections.length !== oldToC?.sections.length) {
    throw new Error("section length doesn't match");
  }

  for (let i = 0; i < (newToC?.sections.length ?? 0); i++) {
    const oldSection = oldToC?.sections[i];
    const newSection = newToC?.sections[i];

    if (!oldSection || !newSection) {
      throw new Error(`Section doesn't exist`);
    }

    if (oldSection.title !== newSection.title) {
      throw new Error(`Title doesn't match for section ${i}`);
    }
    if (oldSection.answer !== newSection.answer) {
      throw new Error(`Answer doesn't match for section ${i}`);
    }
    if (oldSection.anchor !== newSection.anchor) {
      throw new Error(`Anchor doesn't match for section ${i}`);
    }
    if (oldSection.level !== newSection.level) {
      throw new Error(`Level doesn't match for section ${i}`);
    }
    if (oldSection.divider !== newSection.divider) {
      throw new Error(`Divider doesn't match for section ${i}`);
    }
    if (oldSection.offset !== newSection.offset) {
      throw new Error(`Offset doesn't match for section ${i}`);
    }
  }
}

async function testToC(props?: {postId?: string, commentId?: string}) {
  const {postId, commentId} = props ?? {}

  for (const html of regressions) {
    try {
      testHtml(removeKnownDiscrepancies(html))
    } catch (e) {
      const isKnown = knownDifferences.some((s) => html.includes(s))
      if (!isKnown) {
        throw e
      }
    }
  }

  // let posts = await Posts.find({_id: postId}, {limit: 100, sort: {createdAt: -1}}).fetch()
  let posts = await Posts.find({_id: {$in: knownFailingIds}}, {limit: 100, sort: {createdAt: -1}}).fetch()
  let count = 0;
  const failingIds = []

  while (posts.length) {
    for (const [id, html] of posts.map(p => [p._id, p.contents?.html])) {
      try {
        testHtml(removeKnownDiscrepancies(html))
      } catch (e) {
        const isKnown = knownDifferences.some((s) => html.includes(s))
        if (!isKnown) {
          failingIds.push(id)
        }
      }
    }
    count += posts.length;
    console.log(`Tested ${count} posts. ${failingIds.length} failed so far`);

    const lastCreatedAt = posts[posts.length - 1].createdAt;
    posts = await Posts.find({_id: postId, createdAt: {$lt: lastCreatedAt}}, {limit: 100, sort: {createdAt: -1}}).fetch()
  }

  console.log({failingIds})

  // There are 595 which fail
  // What to do:
  // - [X] Fix the narrow problem (actually decided against fixing)
  // - [X] Create a way to filter out headings that match that specific case from the html
  // - [X] Repeat for other problems (looks like that was the vast majority of cases)
  //   - Fairly happy that they're basically all the nested heading issue
  // - [ ] Write tests
  //   - [ ] Regressions for the cases I've fixed here
  //   - [ ] Try to pin down the anchor-in-heading case, do red-green test

  // Remaining cases:
  // failingIds: [
  //   'Mm9qaEisqRmmoZbsX', 'dntYZ44ySurKAZjcz', 'oqWdF3pdZBTh4KCiG',
  //   'RiktA3vY686ggFpaL', 'bFByG6qczuYWjrcnh', 'K2ZhSS4oMxZF6Pekr',
  //   'qe3z5Yfqr2ZoAvWe4', 'kPGqj8BMDzGpvFCCH', 'CcJsh4JcxEqYDaSte',
  //   'HeejJD2huPjn58WeN', 'qS6mfMv5phCWN8Zt6', 'aWr4rMf7ZhoCAtoMc',
  //   'kYihWpaBXcR9tarm6', 'mmsEAyvrrrQz5yE27', 'nrdJpxsFFrg5NgZBj',
  //   'icFeXbGWGhTPfZbbQ', 'ug3aE3rbwLaoQmWri', 'M6FCDYYxcmXkmx8kB',
  //   'KYDhBnbxsq2XT9G4g', 'Ap4H5ss9AA4pz8GLm', '8ZT5kkA8jufKpRFKA',
  //   'rzvieAMwsYWrQRHiB', 'jMAXETfapHYSBLfcF', 'uMChR2q6MzjrcovMN',
  //   'tAx63Rgtu28ksP4AT', '78JnLCuaBePEJ2H4v', '3K3ELn2HkqLeeKX6K',
  //   'dQBEM9piJbv4wR799', 'RMpNAigRM6pHop3Tv', 'Z7uodqDZzmw9PLdPs',
  //   'ejqZkDxzMHyizGZwW', 'cb8DfGKtC8rNNgjAf', 'qFZNXzgGna9jenWJh',
  //   'Zp6dbkzHnwm256Eof', 'ykYCLycLFzRj8b8aR', '6CHMky6dH5NWcXhwk',
  //   '2s7iekT9ujdwAxpJ7', 'QuCP7YaY8zna2jcoB', 'fAkMXofM3wx5A5B9L',
  //   'cjHGS3jYiezLcz6dh', 'sN66zSACBvigKw43t', 'eGNtn8Cgm7rsgbi2v',
  //   'zT6sQ9KcMhnXXDFwp', 'aQoxrCptP6GSP65nC', 'Yr54JMXC3rs2WWyqj',
  //   'DtkwXhnhw3s4ddang', 'E9Mugg6eEd2cNTPuC', 'D6xck9NdPaNKm47Nn',
  //   'EqdbKpoMz8vCEuZHj', 'S9bT84YGHCdkCSwY8', 'psDmebWf4tcYmYG86',
  //   'vQMdah3i7w4mavrgR', 'Dxw4WBZGxJ3rgRzE5', 'TCa5rh5cbESm6PnHE',
  //   'R8vGsHPJqZwF2FHRE', 'NSmTYu5C4YT5Xpx4b', 'NReo7YnvyLJYwRCzS',
  //   'nkefxjarSEFW2BkMu', '44yxoc6ASQh5WJLcA', 'YSz8JsCi3u7fupWHX',
  //   'M4vrdabyPDJ8PwbSk', 'MNPrXCsPpwTgygMxc', 'Pt5e8teMWZnsZ6G3Z',
  //   'XkGR9pemKPGQE4xiq', 'ZjT8kqPDJez5KhPPx', 'hpsbvjmZ7EYQozfHg',
  //   'DPJyt28ggzACZeMmo', 'tSCnGyP5wpSuEmRDQ', 'EKBt7uvYug7haDAfu',
  //   'QXbLkDPmB5AsMJ8F3', 'ikS2xRXkXgZNvHGK3', 'FuzoJwhPtaJTCkSzr',
  //   'FzMnnPxp6nA3gLuf2', 'Co9wY9E4NykXZWguj', 'JnKYarefDFDTBzJaz',
  //   'mH5Wq59rAqHCsjNEs', 'DEnpFdAvqX5S3fMtA', 'N638cECPG4uTppg6L',
  //   'WvPEitTCM8ueYPeeH', 'XmYpa5TPtN4aD4qqt', 'QWLwfqkLxuhaqh3fg',
  //   'px5BGvLSs8kiCrPjN', '53Ya4H2AsB43f9pZq', 'JEC6xhd9Ew5bnFXZ7',
  //   'kiW57dG2W8nyeitNu', 'Mfk8TRfrcub6RDRxH', 'hQtayqi3r6bo3EPoh',
  //   'r7cYRfiMGfcqsBxFg', 'b2Mb3xi9wviMKXrK5', 'yTu9pa9Po4hAuhETJ',
  //   'vPtTWkQFa3npqPwpy', 'icKdYwZjsvdKjJowD', 'TgdXtRvnQH85mswZQ',
  //   'aiNbxdzKC5fbi5mJF'
  // ]
}

Globals.testToC = testToC
