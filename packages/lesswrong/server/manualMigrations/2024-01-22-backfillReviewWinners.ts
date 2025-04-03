import moment from "moment";
import { Posts } from "../../server/collections/posts/collection";
import ReviewWinners from "../../server/collections/reviewWinners/collection";
import { getSqlClientOrThrow } from "../../server/sql/sqlClient";
import { registerMigration } from "./migrationUtils"
import zip from 'lodash/zip'
import { createAdminContext } from "../vulcan-lib/createContexts";
import { createReviewWinner } from "../collections/reviewWinners/mutations";

const AI_TAG_ID = 'sYm3HiWcfZvrGu3ui';

const reviewWinners2018 = [
  'p7x32SEt43ZMC9r7r',
  'Gg9a4y8reWKtLe3Tn',
  'WQFioaudEH8R7fyhm',
  'AfGmsjGPXN97kNp57',
  '9QxnfMYccz9QRgZ5z',
  'X5RyaEDHNq5qutSHK',
  'asmZvCPHcB4SkSCMW',
  'i42Dfoh4HtsCAfXxL',
  'wQACBmK5bioNCgDoG',
  'rYJKvagRYeDM8E9Rf',
  'B2CfMNfay2P8f2yyc',
  'AqbWna2S85pFTsHH4',
  'a4jRN9nbD79PAhWTB',
  'NxF5G6CJiof6cemTw',
  'v7c47vjta3mavY3QC',
  'bBdfbWfWxHN9Chjcq',
  'D6trAzh6DApKPhbv4',
  'CPP2uLcaywEokFKQG',
  'yeADMcScw8EW9yxpH',
  'Djs38EWYZG8o7JMWY',
  'CvKnhXTu9BPcdKE4W',
  'NLBbCQeNLFvBJJkrt',
  'AanbbjYr5zckMKde7',
  'xdwbX9pFEr7Pomaxv',
  'mELQFMi9egPn5EAjK',
  '4ZwGqkMTyAvANYEDw',
  '2G8j8D5auZKKAjSfY',
  'KwdcMts8P8hacqwrX',
  '3rxMBRCYEmHCNDLhu',
  '2jfiMgKkh7qw9z8Do',
  'NQgWL7tvAPgN2LTLn',
  'Qz6w4GYZpgeDp6ATB',
  'BhXA6pvAbsFz3gvn4',
  'nyCHnY7T5PHPLjxmN',
  'nnNdz7XQrd5bWTgoP',
  'YicoiQurNBxSp7a65',
  'XYYyzgyuRH5rFN64K',
  'mFqG58s4NE3EE68Lq',
  'S7csET9CgBtpi7sCh',
  'tj8QP2EFdP8p54z6i',
  'yEa7kwoMpsBgaBCgb',
  'QTLTic5nZ2DaBtoCv'
];

const reviewWinners2019 = [
  'HBxe6wdjxK239zajf', 'FkgsxrGf3QxhfLWHG', 'SwcyMEgLyd4C3Dern',
  'XvN2QQpKTuEzgkZHY', 'Zm7WAJMTaFvuh2Wc7', 'u8GMcpEN9Z6aQiCvp',
  'i9xyZBS3qzA8nFXNQ', 'YRgMCXMbkKBZgMz4M', 'DoPo4PDjgSySquHX8',
  'ZDZmopKquzHYPRNxq', '4ZvJab25tDebB8FGE', 'zp5AEENssb8ZDnoZR',
  'f886riNJcArmpFahm', 'G5TwJ9BGxcgh5DsmQ', '4QemtxDFaGXyGSrGD',
  'ximou2kyQorm6MPjX', '6DuJxY8X45Sco4bS2', 'X2i9dQQK3gETCyqh2',
  'x3fNwSe5aWZb5yXEG', 'nRAMpjnb6Z4Qv3imF', 'xCxeBSHqMEaP3jDvY',
  'FRv7ryoqtvSuqBxuT', 'ham9i5wf4JCexXnkN', 'xhE4TriBSPywGuhqi',
  'nEBbw2Bc2CnN2RMxy', '4EGYhyyJXSnE7xJ9H', 'vKErZy7TFhjxtyBuG',
  'rBkZvbGDQZhEymReM', 'PrCmeuBPC4XLDQz8C', 'zTfSXQracE7TW8x4w',
  'ygFc4caQ6Nws62dSW', '8XDZjfThxDxLvKWiM', 'ZFtesgbY9XwtqqyZ5',
  'bnY3L48TtDrKTzGRb', 'cM8GNMpzfKCkPnd5v', 'YN6daWakNnkXEeznB',
  'uXH4r6MmKPedk8rMA', '36Dhz325MZNq3Cs6B', '9fB4gvoooNYa4t56S',
  'TPjbTXntR54XSZ3F2', 'qmXqHKpgRfg83Nif9', 'duxy4Hby5qMsv42i8',
  'RQpNHSiWaXTvDxt6R', 'PqMT9zGrNsGJNfiFR', 'EYd63hYSzadcNnZTD',
  'E4zGWYzh6ZiG85b2z', 'Ajcq9xWi2fmgn8RBJ', 'TMFNQoRZxM4CuRCY6',
  'JJFphYfMsdFMuprBy', 'kKSFsbjdX3kxsYaTM', '8xLtE3BwgegJ7WBbf',
  'f2GF3q6fgyx8TqZcn', 'fnkbdwckdfHS2H22Q', 'bNXdnRTpSXk9p4zmi',
  '5gfqG3Xcopscta3st', 'JBFHzfPkXHB2XfDGj', '8SEvTvYFX2KDRZjti',
  'gvK5QWRLk3H8iqcNy'
];

const reviewWinners2020 = [
  'KrJfoZzpSDpnrv9va',
  'fRsjBseRuvRhMPPE5',
  'wEebEiPpEwjYvnyqq',
  'krarE7WFijAtHf3hm',
  'Nwgdq6kHke5LY692J',
  'Tr7tAyt5zZpdTwTQK',
  '5okDRahtDewnWfFmz',
  'bx3gkHJehRCYZAF3r',
  'znfkdCoHMANwqc2WE',
  'qDmnyEMtJkE9Wrpau',
  'YABJKJ3v97k9sbxwg',
  '8xRSjC76HasLnMGSf',
  'gQY6LrTWJNkTv8YJR',
  'P6fSj3t4oApQQTB7E',
  'ZyWyAJbedvEgRT2uF',
  'ivpKSjM4D6FbqF4pZ',
  'diruo47z32eprenTg',
  'AHhCrJ2KpTjsCSwbt',
  'aFaKhG86tTrKvtAnT',
  'RcifQCKkRc9XTjxC2',
  'hyShz2ABiKX56j5tJ',
  'KkwtLtroaNToWs2H6',
  'A8iGaZ3uHNNGgJeaD',
  'D4hHASaZuLCW92gMy',
  'zB4f7QqKhBHa5b37a',
  'xJyY5QkQvNJpZLJRo',
  'byewoxJiAfwE6zpep',
  'q3JY4iRzjq56FyjGF',
  'hvGoYXi2kgnS3vxqb',
  'r3NHPD3dLFNk9QE2Y',
  'rz73eva3jv267Hy7B',
  'CeZXDmp8Z363XaM6b',
  'YcdArE79SDxwWAuyF',
  'WFopenhCXyHX3ukw3',
  '4K5pJnKBGkqqTbyxx',
  'L6Ktf952cwdMJnzWm',
  'eccTPEonRe4BAvNpD',
  'sTwW3QLptTQKuyRXx',
  'sT6NxFxso6Z9xjS7o',
  'N9oKuQKuf7yvCCtfq',
  'x6hpkYyzMG6Bf8T3W',
  'GZSzMqr8hAB2dR8pk',
  '4s2gbwMHSdh2SByyZ',
  'JPan54R525D68NoEt',
  'nNqXfnjiezYukiMJi',
  'ax695frGJEzGxFBK4',
  'Z9cbwuevS9cqaR96h'
];

const reviewWinners2021 = [
  'JD7fwtRQ27yc8NoqS',
  'SWxnP5LZeJzuT3ccd',
  'MzKKi7niyEqkBPnyu',
  'qHCDysDnvhteW7kRd',
  '5FZxhdi6hZp8QwK7k',
  'qc7P2NwfxQMC3hdgm',
  'gNodQGNoPDjztasbh',
  'rzqACeBGycZtqCfaX',
  '6Xgy6CAf2jqHhynHL',
  '7im8at9PmhbT4JHsW',
  'Psr9tnQFuEXiuqGcR',
  '4XRjPocTprL4L8tmB',
  'DQKgYhEYP86PLW7tZ',
  '2cYebKxNp47PapHTL',
  'niQ3heWwF6SydhS7R',
  'BcYfsi7vmhDvzQGiF',
  'F5ktR95qqpmGXXmLq',
  'AyNHoTWWAJ5eb99ji',
  't2LGSDwT7zSnAGybG',
  'LpM3EAakwYdS6aRKf',
  'fRwdkop6tyhi3d22L',
  '3L46WGauGpr7nYubu',
  'hNqte2p48nqKux3wS',
  'N5Jm6Nj4HkNKySA5Z',
  'G2Lne2Fi7Qra5Lbuf',
  '3qX2GipDuCq5jstMG',
  'EF5M6CmKRd6qZk27Z',
  'DtcbfwSrcewFubjxp',
  '57sq9qA3wurjres4K',
  'tTWL6rkfEuQN9ivxj',
  'dYspinGtiba5oDCcv',
  'vQKbgEKjGZcpbCqDs',
  'pv7Qpu8WSge8NRbpB',
  'cujpciCqNbawBihhQ',
  'cCMihiwtZx7kdcKgt',
  'o4cgvYmNZnfS4xhxL',
  'tF8z9HBoBn783Cirz',
  'vLRxmYCKpmZAAJ3KC',
  'mRwJce3npmzbKfxws',
  'XtRAkvvaQSaQEyASj',
  '9cbEPEuCa9E7uHMXT',
  'CSZnj2YNMKGfsMbZA',
  'X79Rc5cA5mSWBexnd',
  'Cf2xxC3Yx9g6w7yXN',
  'ThvvCE2HsLohJYd7b'
];

const reviewWinners2022 = [
  "uMQ3cqWDPHhjtiesc",
  "j9Q8bRmwCgXRYAgcJ",
  "CoZhXrhpQxpy9xw9y",
  "uFNgRumrDTpBfQGrs",
  "pdaGN6pQyQarFHXF4",
  "keiYkaeoLHoKK4LYA",
  "a5e9arCnbDac9Doig",
  "vzfz4AS6wbooaTeQk",
  "9kNxhKWvixtKW5anS",
  "pRkFkzwKZ2zfa3R6H",
  "k9dsbn8LZ6tTesDS3",
  "fFY2HeC9i2Tx8FEnK",
  "gHefoxiznGfsbiAu9",
  "3pinFH3jerMzAvmza",
  "vJFdjigzmcXMhNTsx",
  "jbE85wCkRr9z7tqmD",
  "o3RLHYviTE4zMb9T9",
  "LDRQ5Zfqwi8GjzPYG",
  "bhLxWTkRc8GXunFcB",
  "xhD6SHAAE9ghKZ9HS",
  "vJ7ggyjuP4u2yHNcP",
  "nSjavaKcBrtNktzGa",
  "kpPnReyBC54KESiSn",
  "6Fpvch8RR29qLEWNH",
  "ma7FSEtumkve8czGF",
  "xFotXGEotcKouifky",
  "rP66bz34crvDudzcJ",
  "B9kP6x5rpmuCzpfWb",
  "kipMvuaK3NALvFHc9",
  "REA49tL5jsh69X3aM",
  "N6WM6hs7RQMKDhYjB",
  "CKgPFHoWFkviYz7CB",
  "R6M4vmShiowDn56of",
  "JvZhhzycHu2Yd57RN",
  "htrZrxduciZ5QaCjw",
  "J3wemDGtsy5gzD3xa",
  "2MiDpjWraeL5bypRE",
  "mmHctwkKjpvaQdC3c",
  "TWorNr22hhYegE4RT",
  "w4aeAFzSAguvqA5qu",
  "Ke2ogqSEhL2KCJCNx",
  "FWvzwCDRgcjb9sigb",
  "GNhMPAWcfBCASy8e6",
  "CjFZeDD6iCnNubDoS",
  "ii4xtogen7AyYmN6B",
  "Jk9yMXpBLMWNTFLzh",
  "nTGEeRSZrfPiJwkEc",
  "sbcmACvB6DqYXYidL",
  "iCfdcxiyr2Kj8m8mT",
  "L4anhrxjv8j2yRKKp",
  "SA9hDewwsYgnuscae"
]

export const findReviewWinners = async function (year: number) {
  const posts = await Posts.find({
    postedAt: {
      $gte: moment(`${year}-01-01`).toDate(),
      $lt: moment(`${year + 1}-01-01`).toDate()
    },
        finalReviewVoteScoreAllKarma: { $gte: 1 },
    reviewCount: { $gte: 1 },
    positiveReviewVoteCount: { $gte: 1 }
  }).fetch()

  // we weight the high karma user's votes 3x higher than baseline
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(posts.sort((post1, post2) => {
    const score1 = (post1.finalReviewVoteScoreHighKarma * 2) + post1.finalReviewVoteScoreAllKarma
    const score2 = (post2.finalReviewVoteScoreHighKarma * 2) + post2.finalReviewVoteScoreAllKarma
    return score2 - score1
  }).map(post => post._id)))
}


export default registerMigration({
  name: "backfillReviewWinners",
  dateWritten: "2024-01-22",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const existingWinners = await ReviewWinners.find({}, { projection: { postId: 1 } }).fetch();
    const naiveTotalIdRanking = zip(reviewWinners2018, reviewWinners2019, reviewWinners2020, reviewWinners2021, reviewWinners2022).flat().filter((id): id is string => !!id);

    existingWinners.filter(({ postId }) => !naiveTotalIdRanking.includes(postId)).forEach(({ postId }) => {
      // eslint-disable-next-line no-console
      console.log('Existing winner not in intended list:', postId);
    })
    // eslint-disable-next-line no-console
    console.log(`Starting to create ${naiveTotalIdRanking.length} ReviewWinners`);

    const naiveAiPostIds = await db.any<{ _id: string }>(`
      SELECT _id
      FROM "Posts"
      WHERE ("tagRelevance" -> '${AI_TAG_ID}')::INT > 0
      AND _id IN ($1:csv)
    `, [naiveTotalIdRanking]);

    // eslint-disable-next-line no-console
    console.log(`Found ${naiveAiPostIds.length} posts tagged as AI posts`);

    const naiveAiPostIdSet = new Set(naiveAiPostIds.map(({ _id }) => _id));

    const allReviewWinnersByYear = [
      [reviewWinners2018, 2018],
      [reviewWinners2019, 2019],
      [reviewWinners2020, 2020],
      [reviewWinners2021, 2021],
      [reviewWinners2022, 2022]
    ] as const;

    const adminContext = createAdminContext();

    for (let [reviewWinnerIds, reviewYear] of allReviewWinnersByYear) {
      // eslint-disable-next-line no-console
      console.log(`Starting to create ${reviewWinnerIds.length} ReviewWinners for year ${reviewYear}`);

      await Promise.all(reviewWinnerIds.map((reviewWinnerPostId, idx) => {
        const naiveCuratedOrder = naiveTotalIdRanking.indexOf(reviewWinnerPostId);
        const naiveIsAI = naiveAiPostIdSet.has(reviewWinnerPostId);
        if (existingWinners.some(({ postId }) => postId === reviewWinnerPostId)) return Promise.resolve();

        return createReviewWinner({
          data: {
            postId: reviewWinnerPostId,
            reviewYear,
            reviewRanking: idx,
            curatedOrder: naiveCuratedOrder,
            isAI: naiveIsAI,
          }
        }, adminContext, true).catch(e => {
          // eslint-disable-next-line no-console
          console.dir(e);
          throw new Error(`Failed to create ReviewWinner for postId ${reviewWinnerPostId}`)
        });
      }));
    }
  }
});
