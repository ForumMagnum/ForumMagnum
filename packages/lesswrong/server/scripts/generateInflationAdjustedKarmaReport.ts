import { Posts } from "../../server/collections/posts/collection";
import { getKarmaInflationSeries } from "../../lib/collections/posts/karmaInflation";
import { buildInflationAdjustedField } from "../../lib/collections/posts/views";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import fs from 'fs';

const RELATIVE_TO = '2023-07-01T00:00:00.000Z';

// Exported to allow running manually with "yarn repl"
export const generateInflationAdjustedKarmaReport = async ({threshold = 100, relativeTo = RELATIVE_TO}: {threshold?: number, relativeTo?: string}) => {
  const karmaInflationSeries = getKarmaInflationSeries();

  // Get threshold in inflation adjusted karma
  const relativeToIdx = Math.floor((new Date(relativeTo).getTime() - karmaInflationSeries.start) / karmaInflationSeries.interval);
  const adjustment = (karmaInflationSeries.values[relativeToIdx] || karmaInflationSeries.values[karmaInflationSeries.values.length - 1])
  const adjustedThreshold = threshold * adjustment;

  // Get all posts with required fields
  const pipeline = [
    {
      $addFields: buildInflationAdjustedField()
    },
    {
      $project: {
        _id: 1,
        slug: 1,
        baseScore: 1,
        postedAt: 1,
        // TODO: This is probably broken after normalizing word count - seems not
        // worth the effort to fix right now since this is a very rarely used
        // script
        wordCount: "$contents.wordCount",
      }
    }
  ];

  const posts = await Posts.aggregate(pipeline).toArray();

  // filter posts where the adjusted karma is above the threshold
  const results = posts.filter((post: AnyBecauseHard) => post.karmaInflationAdjustedScore > adjustedThreshold);

  // sort the results by descending adjusted karma
  results.sort((a: AnyBecauseHard, b: AnyBecauseHard) => b.karmaInflationAdjustedScore - a.karmaInflationAdjustedScore);

  // write the results to a CSV file
  const csvFileName = 'inflation_adjusted_karma_report.csv';
  const header = 'post_id,posted_at,slug,url,karma,adjusted_karma,word_count\n';
  const fileRows = results.map((post: AnyBecauseHard) => `${post._id},${post.postedAt.toISOString()},${post.slug},https://forum.effectivealtruism.org${postGetPageUrl(post)},${post.baseScore},${post.karmaInflationAdjustedScore / adjustment},${post.wordCount}`).join('\n');
  fs.writeFileSync(csvFileName, header + fileRows);

  // log the name of the CSV file
  // eslint-disable-next-line no-console
  console.log(`Inflation adjusted karma report saved to ${csvFileName}`);
}
