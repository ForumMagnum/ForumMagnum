import { REVIEW_YEAR } from '@/lib/reviewUtils';
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

interface PostReviewWinnersViewTerms extends ViewTermsBase {
  view?: 'reviewWinnerSingle'|'bestOfLessWrongAnnouncement';
  reviewYear?: number;
  reviewRanking?: number;
  category?: string;
}

declare global {
  type ReviewWinnersViewTerms = PostReviewWinnersViewTerms;
}

function reviewWinnerSingle(terms: PostReviewWinnersViewTerms) {
  return {
    selector: {
      category: terms.category,
      reviewYear: terms.reviewYear,
      reviewRanking: terms.reviewRanking
    }
  };
}

function bestOfLessWrongAnnouncement() {
  return {
    selector: {
      _id: {
        // the top 3 winners of each category, for the most recent year
        $in: [
          'J8NJ2P3BZ7kFipJRq', 'ZLDe6fkJujBi82uni', '2ZjiwMBKbwnLugpkt', 'xmaEheyR38b4uvukZ', 'sg764fMCcucPALosr', '4Z4nA4zcc782nx3A8', 'ZLjciCktgoqGiNB29', 'xnKryiM7ZCpvdvniL', 'S8pM7Abj3MzdSjFE4', '3G52nqBHmbgqTsS5M', 'tcPKsGv5W3FNbmHAi', 'aXkdhqNe97P54tqaw', 'KTcyhwZXrDjwrHno6', 'jQbrebZtMvBueLaDQ', 'cccL2hK8zbJJdPc4b', '4gQcQ4uJ2chZRADiZ', 'sD4mr92qrmckK9hE8', 'pwZwZ9MKS9GbhAYT7'
        ]
      }
    },
    options: {
      sort: {
        reviewRanking: 1
      },
    }
  };
}

export const ReviewWinnersViews = new CollectionViewSet('ReviewWinners', {
  reviewWinnerSingle,
  bestOfLessWrongAnnouncement
});
