import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import { createAdminContext, createMutator } from "../vulcan-lib";
import { registerMigration } from "./migrationUtils"
import zip from 'lodash/zip'

const AI_TAG_ID = 'sYm3HiWcfZvrGu3ui';

const reviewWinners2018 = [
  'X5RyaEDHNq5qutSHK',
  '5bd75cc58225bf0670375533',
  'AfGmsjGPXN97kNp57',
  'yeADMcScw8EW9yxpH',
  'D6trAzh6DApKPhbv4',
  'i42Dfoh4HtsCAfXxL',
  '2jfiMgKkh7qw9z8Do',
  'Qz6w4GYZpgeDp6ATB',
  'QTLTic5nZ2DaBtoCv',
  'S7csET9CgBtpi7sCh',
  'NxF5G6CJiof6cemTw',
  'p7x32SEt43ZMC9r7r',
  'tj8QP2EFdP8p54z6i',
  '2G8j8D5auZKKAjSfY',
  'YicoiQurNBxSp7a65',
  'v7c47vjta3mavY3QC',
  'WQFioaudEH8R7fyhm',
  'xdwbX9pFEr7Pomaxv',
  'wQACBmK5bioNCgDoG',
  'mELQFMi9egPn5EAjK',
  '4ZwGqkMTyAvANYEDw',
  'KwdcMts8P8hacqwrX',
  'nnNdz7XQrd5bWTgoP',
  'nyCHnY7T5PHPLjxmN',
  'Djs38EWYZG8o7JMWY',
  'a4jRN9nbD79PAhWTB',
  'rYJKvagRYeDM8E9Rf',
  'BhXA6pvAbsFz3gvn4',
  'bBdfbWfWxHN9Chjcq',
  'NQgWL7tvAPgN2LTLn',
  'AanbbjYr5zckMKde7',
  '9QxnfMYccz9QRgZ5z',
  'AqbWna2S85pFTsHH4',
  'B2CfMNfay2P8f2yyc',
  '3rxMBRCYEmHCNDLhu',
  'Gg9a4y8reWKtLe3Tn',
  'asmZvCPHcB4SkSCMW',
  'CPP2uLcaywEokFKQG',
  'yEa7kwoMpsBgaBCgb',
  'NLBbCQeNLFvBJJkrt',
  'XYYyzgyuRH5rFN64K',
  'mFqG58s4NE3EE68Lq'
];

const reviewWinners2019 = [
  'bnY3L48TtDrKTzGRb', 'PqMT9zGrNsGJNfiFR', '8SEvTvYFX2KDRZjti',
  'YRgMCXMbkKBZgMz4M', 'XvN2QQpKTuEzgkZHY', 'ygFc4caQ6Nws62dSW',
  'EYd63hYSzadcNnZTD', 'bNXdnRTpSXk9p4zmi', 'Zm7WAJMTaFvuh2Wc7',
  'i9xyZBS3qzA8nFXNQ', '5gfqG3Xcopscta3st', 'X2i9dQQK3gETCyqh2',
  'RQpNHSiWaXTvDxt6R', 'cM8GNMpzfKCkPnd5v', 'JBFHzfPkXHB2XfDGj',
  '8XDZjfThxDxLvKWiM', 'rBkZvbGDQZhEymReM', 'nEBbw2Bc2CnN2RMxy',
  'gvK5QWRLk3H8iqcNy', 'uXH4r6MmKPedk8rMA', 'DoPo4PDjgSySquHX8',
  'qmXqHKpgRfg83Nif9', 'ZFtesgbY9XwtqqyZ5', '4EGYhyyJXSnE7xJ9H',
  'xhE4TriBSPywGuhqi', '8xLtE3BwgegJ7WBbf', 'f2GF3q6fgyx8TqZcn',
  'vKErZy7TFhjxtyBuG', 'JJFphYfMsdFMuprBy', 'zTfSXQracE7TW8x4w',
  'ham9i5wf4JCexXnkN', 'f886riNJcArmpFahm', '4QemtxDFaGXyGSrGD',
  'TPjbTXntR54XSZ3F2', '9fB4gvoooNYa4t56S', 'YN6daWakNnkXEeznB',
  'TMFNQoRZxM4CuRCY6', 'xCxeBSHqMEaP3jDvY', 'x3fNwSe5aWZb5yXEG',
  'ximou2kyQorm6MPjX', 'FkgsxrGf3QxhfLWHG', 'u8GMcpEN9Z6aQiCvp',
  '6DuJxY8X45Sco4bS2', 'ZDZmopKquzHYPRNxq', 'kKSFsbjdX3kxsYaTM',
  'fnkbdwckdfHS2H22Q', '36Dhz325MZNq3Cs6B', 'Ajcq9xWi2fmgn8RBJ',
  'E4zGWYzh6ZiG85b2z', 'SwcyMEgLyd4C3Dern', 'duxy4Hby5qMsv42i8',
  'zp5AEENssb8ZDnoZR', 'nRAMpjnb6Z4Qv3imF', 'PrCmeuBPC4XLDQz8C',
  'FRv7ryoqtvSuqBxuT', 'HBxe6wdjxK239zajf', 'G5TwJ9BGxcgh5DsmQ',
  '4ZvJab25tDebB8FGE'
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
  'ax695frGJEzGxFBK4'
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

registerMigration({
  name: "backfillReviewWinners",
  dateWritten: "2024-01-22",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const naiveTotalIdRanking = zip(reviewWinners2018, reviewWinners2019, reviewWinners2020, reviewWinners2021).flat().filter((id): id is string => !!id);

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
      [reviewWinners2021, 2021]
    ] as const;

    const adminContext = createAdminContext();

    for (let [reviewWinnerIds, reviewYear] of allReviewWinnersByYear) {
      // eslint-disable-next-line no-console
      console.log(`Starting to create ${reviewWinnerIds.length} ReviewWinners for year ${reviewYear}`);

      await Promise.all(reviewWinnerIds.map((reviewWinnerPostId, idx) => {
        const naiveCuratedOrder = naiveTotalIdRanking.indexOf(reviewWinnerPostId);
        const naiveIsAI = naiveAiPostIdSet.has(reviewWinnerPostId);

        return createMutator({
          collection: ReviewWinners,
          document: {
            postId: reviewWinnerPostId,
            reviewYear,
            reviewRanking: idx,
            curatedOrder: naiveCuratedOrder,
            isAI: naiveIsAI
          },
          context: adminContext,
          currentUser: adminContext.currentUser
        });
      }));
    }
  }
})
