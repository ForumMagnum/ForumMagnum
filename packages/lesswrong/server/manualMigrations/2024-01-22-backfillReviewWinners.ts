import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { createMutator } from "../vulcan-lib";
import { registerMigration } from "./migrationUtils"

type ReviewWinnerPost = DbPost & {
  collectionId: string;
  bookId: string;
  reviewYear: number;
  rankWithinYear: number;
};

const BEST_OF_LESSWRONG_COLLECTION_ID = 'nmk3nLpQE89dMRzzN';

const reviewWinners2018 = [
  [ 'Embedded Agents', 1 ],
  [ 'The Rocket Alignment Problem', 2 ],
  [ 'Local Validity as a Key to Sanity and Civilization', 3 ],
  [ 'Arguments about fast takeoff', 4 ],
  [ 'The Costly Coordination Mechanism of Common Knowledge', 5 ],
  [ 'Anti-social Punishment', 7 ],
  [ 'The Tails Coming Apart As Metaphor For Life', 8 ],
  [ 'Babble', 9 ],
  [ 'More Babble', 9 ],
  [ 'Prune', 9 ],
  [ 'The Loudest Alarm Is Probably False', 10 ],
  [ 'The Intelligent Social Web', 11 ],
  [ 'Prediction Markets: When Do They Work?', 12 ],
  [ 'Coherence arguments do not imply goal-directed behavior', 13 ],
  [ 'Is Science Slowing Down?', 14 ],
  [ 'Robustness to Scale', 15.5 ],
  [ 'A voting theory primer for rationalists', 15.5 ],
  [ 'Toolbox-thinking and Law-thinking', 17 ],
  [ 'A Sketch of Good Communication', 18 ],
  [ "Paul's research agenda FAQ", 20 ],
  [ 'An Untrollable Mathematician', 22 ],
  [ 'Varieties Of Argumentative Experience', 24 ],
  [ 'Specification gaming examples in AI', 24 ],
  [ 'Meta-Honesty: Firming Up Honesty Around Its Edge-Cases', 26 ],
  [
    'My attempt to explain Looking, insight meditation, and enlightenment in non-mysterious terms',
    28
  ],
  [ 'Naming the Nameless', 28 ],
  [ 'Inadequate Equilibria vs. Governance of the Commons', 28 ],
  [ 'Noticing the Taste of Lotus', 32.5 ],
  [ 'The Pavlov Strategy', 32.5 ],
  [ 'Being a Robust Agent', 32.5 ],
  [ 'Spaghetti Towers', 35 ],
  [ 'Beyond Astronomical Waste', 36.5 ],
  [ 'Research: Rescuers during the Holocaust', 36.5 ],
  [ 'Open question: are minimal circuits daemon-free?', 38.5 ],
  [ 'On the Loss and Preservation of Knowledge', 40 ],
  [ 'Is Clickbait Destroying Our General Intelligence?', 41 ],
  [ 'What makes people intellectually active?', 42 ],
  [ 'Why did everything take so long?', 43 ],
  [
    'Challenges to Christiano’s capability amplification proposal',
    44
  ],
  [
    'Historical mathematicians exhibit a birth order effect too',
    63.5
  ],
  [ 'Towards a New Impact Measure', 63.5 ],
  [ 'Birth order effect found in Nobel Laureates in Physics', 73 ]
];

const reviewWinners2019 = [
  [ 'What failure looks like', 1 ],
  [ 'Risks from Learned Optimization: Introduction', 2 ],
  [ 'The Parable of Predict-O-Matic', 3 ],
  [ 'Being the (Pareto) Best in the World', 4.5 ],
  [ 'Book Review: The Secret Of Our Success', 4.5 ],
  [ 'Rule Thinkers In, Not Out', 6 ],
  [ 'Book summary: Unlocking the Emotional Brain', 7 ],
  [ 'Asymmetric Justice', 8.5 ],
  [
    'Heads I Win, Tails?—Never Heard of Her; Or, Selective Reporting and the Tragedy of the Green Rationalists',
    8.5
  ],
  [ 'Selection vs Control', 11.5 ],
  [ `You Get About Five Words`, 11.5 ],
  [ 'The Schelling Choice is "Rabbit", not "Stag"', 13 ],
  [ 'Noticing Frame Differences', 14 ],
  [ `Yes Requires the Possibility of No
`, 15 ],
  [ '"Other people are wrong" vs "I am right"', 16 ],
  [ 'Rest Days vs Recovery Days', 17 ],
  [`Seeking Power is Often Convergently Instrumental in MDPs`, 18.5],
  [ `Chris Olah’s views on AGI safety`, 20.5 ],
  [
    'Reframing Superintelligence: Comprehensive AI Services as General Intelligence',
    22
  ],
  [ 'The strategy-stealing assumption', 23.5 ],
  [ 'Reframing Impact', 26.5 ],
  [ 'Understanding “Deep Double Descent”', 26.5 ],
  [ `Moloch Hasn’t Won`, 26.5 ],
  [
    'Integrity and accountability are core parts of rationality',
    26.5
  ],
  [ 'Gears-Level Models are Capital Investments', 30.5 ],
  [ 'In My Culture', 30.5 ],
  [ 'Make more land', 30.5 ],
  [ 'Forum participation as a research strategy', 30.5 ],
  [ 'Unconscious Economics', 33 ],
  [ 'Mistakes with Conservation of Expected Evidence', 34.5 ],
  [ 'Bioinfohazards', 34.5 ],
  [ 'Excerpts from a larger discussion about simulacra', 37 ],
  [ 'human psycholinguists: a critical appraisal', 38 ],
  [ 'AI Safety "Success Stories"', 40 ],
  [ 'Do you fear the rock or the hard place?', 40 ],
  [ 'Propagating Facts into Aesthetics', 40 ],
  [ 'Gradient hacking', 42 ],
  [ 'The Amish, and Strategic Norms around Technology', 44 ],
  [ 'Power Buys You Distance From The Crime', 44 ],
  [ 'Paper-Reading for Gears', 44 ],
  [
    "How to Ignore Your Emotions (while also thinking you're awesome at emotions)",
    48.5
  ],
  [ 'The Real Rules Have No Exceptions', 48.5 ],
  [ 'Coherent decisions imply consistent utilities', 48.5 ],
  [ 'Alignment Research Field Guide', 48.5 ],
  [ 'Blackmail', 48.5 ],
  [ 'The Curse Of The Counterfactual', 48.5 ],
  [ 'The Credit Assignment Problem', 52.5 ],
  [ "Reason isn't magic", 52.5 ],
  [ 'Mental Mountains', 54 ],
  [ 'Simple Rules of Law', 56.5 ],
  [ 'Is Rationalist Self-Improvement Real?', 56.5 ],
  [ 'Literature Review: Distributed Teams', 56.5 ],
  [ 'Steelmanning Divination', 59 ],
  [ 'Book Review: Design Principles of Biological Circuits', 60 ],
  [ 'Building up to an Internal Family Systems model', 61 ],
  [ 'Evolution of Modularity', 62 ],
  [ "[Answer] Why wasn't science invented in China?", 63 ],
  [ 'Gears vs Behavior', 79 ]
];

const getReviewYear = (bookId: string) => {
  switch (bookId) {

  }
}

registerMigration({
  name: "backfillReviewWinners",
  dateWritten: "2024-01-22",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const reviewWinner20And21Posts = await db.any<ReviewWinnerPost>(`
      WITH review_winners AS (
        SELECT
          b._id AS "bookId",
          p.*
        FROM "Collections" c
        JOIN "Books" b
          ON b."collectionId" = c._id
        JOIN LATERAL UNNEST(b."sequenceIds") AS sequence_id
          ON TRUE
        JOIN "Sequences" s
          ON s._id = sequence_id
        JOIN "Chapters" ch
          ON s._id = ch."sequenceId"
        JOIN LATERAL UNNEST(ch."postIds") AS post_id
          ON TRUE
        JOIN "Posts" p
          ON p._id = post_id
        WHERE c._id = 'nmk3nLpQE89dMRzzN'
      )
      SELECT
        (
          SELECT
            COALESCE(MIN(rv.year::SMALLINT), 2018)
          FROM "ReviewVotes" rv
          WHERE rv."postId" IN (
            SELECT _id
            FROM review_winners rw2
            WHERE rw2."bookId" = rw."bookId"
          )
        ) AS "reviewYear",
        rw."finalReviewVoteScoreHighKarma",
        (ROW_NUMBER() OVER (PARTITION BY rw."bookId" ORDER BY rw."finalReviewVoteScoreHighKarma" DESC) - 1) AS "rankWithinYear",
        rw.title
      FROM review_winners rw
      WHERE (
        SELECT
          COALESCE(MIN(rv.year::SMALLINT), 2018)
        FROM "ReviewVotes" rv
        WHERE rv."postId" IN (
          SELECT _id
          FROM review_winners rw2
          WHERE rw2."bookId" = rw."bookId"
        )
      ) > 2019
      GROUP BY 2, 4
      ORDER BY 1 ASC, 3 ASC
    `, [BEST_OF_LESSWRONG_COLLECTION_ID]);

    reviewWinner20And21Posts.map(reviewWinnerPost => {
      const { collectionId, bookId, reviewYear, rankWithinYear, ...post } = reviewWinnerPost;
      return createMutator({
        collection: ReviewWinners,
        document: {
          postId: post._id,
          reviewYear,
          reviewRanking: rankWithinYear,
          // TODO
        }
      });
    });
  }
})
