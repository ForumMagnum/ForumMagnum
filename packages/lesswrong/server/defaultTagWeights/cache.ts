import Tags from "../../lib/collections/tags/collection";
import type { FilterMode } from "../../lib/filterSettings";

let tagDefaultWeights: { [_id: string]: FilterMode } = {};
export const getTagDefaultWeights = () => tagDefaultWeights;

export async function refreshTagDefaultWeights() {
  tagDefaultWeights = Object.fromEntries(
    (await Tags.find({defaultFilterMode: {$exists: true}}).fetch())
      // Casting because the generated type does not realize the schema
      // constrains it to be one of the FilterMode values
      .map(tag => [tag._id, tag.defaultFilterMode as FilterMode])
  )
}
