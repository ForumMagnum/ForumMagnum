import ElectionCandidates from "../../lib/collections/electionCandidates/collection";
import { addCronJob } from "../cronUtil";
import { Globals } from "../vulcan-lib";

type ElectionCandidateAmounts = {
  amountRaised: number,
  // TODO pull in the targetAmount here also
}

const fetchNewAmounts = async (gwwcId: string): Promise<ElectionCandidateAmounts> => {
  const res = await fetch("https://parfit.effectivealtruism.org/graphql", {
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      pragma: "no-cache",
    },
    body: `{"query":"{\\n  getFundraiserStatsList(fundraiserId: \\"${gwwcId}\\") {\\n    fundraiserId\\n    amountRaisedNormalized\\n    numDonors\\n  }\\n}\\n","variables":null}`,
    method: "POST",
  });

  const data = await res.json();
  const amountRaised = data.data.getFundraiserStatsList[0].amountRaisedNormalized; // Amount in dollars

  return {
    amountRaised: parseFloat(amountRaised),
  }
}

async function updateFundraiserAmounts() {
  const electionCandidates = (await ElectionCandidates.find({
    gwwcId: { $exists: true },
  }).fetch()) as (DbElectionCandidate & { gwwcId: string })[];

  const newAmounts: Record<string, ElectionCandidateAmounts> = {};

  for (const candidate of electionCandidates) {
    try {
      const {amountRaised} = await fetchNewAmounts(candidate.gwwcId);
    newAmounts[candidate._id] = {amountRaised};
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch new amounts for candidate ${candidate._id}`, e);
    }
  }

  // Bulk update all the candidates
  const updates = Object.entries(newAmounts).map(([candidateId, {amountRaised}]) => ({
    updateOne: {
      filter: {_id: candidateId},
      update: {
        $set: {
          amountRaised
        }
      }
    }
  }));

  await ElectionCandidates.rawCollection().bulkWrite(updates);
}

addCronJob({
  name: 'updateFundraiserAmounts',
  interval: 'every 5 minutes',
  job: updateFundraiserAmounts
});

Globals.updateFundraiserAmounts = updateFundraiserAmounts;
