import CollectionsRepo from "./CollectionsRepo";
import ClientIdsRepo from "./ClientIdsRepo";
import CommentsRepo from "./CommentsRepo";
import ConversationsRepo from "./ConversationsRepo";
import CurationEmailsRepo from "./CurationEmailsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import ElectionCandidatesRepo from "./ElectionCandidatesRepo";
import ElectionVotesRepo from "./ElectionVotesRepo";
import ForumEventsRepo from "./ForumEventsRepo";
import JargonTermsRepo from "./JargonTermsRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import LWEventsRepo from "./LWEventsRepo";
import ManifoldProbabilitiesCachesRepo from "./ManifoldProbabilitiesCachesRepo";
import NotificationsRepo from "./NotificationsRepo";
import PageCacheRepo from "./PageCacheRepo";
import PostEmbeddingsRepo from "./PostEmbeddingsRepo";
import PostRecommendationsRepo from "./PostRecommendationsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostViewTimesRepo from "./PostViewTimesRepo";
import PostViewsRepo from "./PostViewsRepo";
import PostsRepo from "./PostsRepo";
import ReadStatusesRepo from "./ReadStatusesRepo";
import RecommendationsCachesRepo from "./RecommendationsCachesRepo";
import ReviewWinnersRepo from "./ReviewWinnersRepo";
import ReviewWinnerArtsRepo from "./ReviewWinnerArtsRepo";
import RevisionsRepo from "./RevisionsRepo";
import SequencesRepo from "./SequencesRepo";
import SideCommentCachesRepo from "./SideCommentCachesRepo";
import SplashArtCoordinatesRepo from "./SplashArtCoordinatesRepo";
import SpotlightsRepo from "./SpotlightsRepo";
import SurveysRepo from "./SurveysRepo";
import SurveySchedulesRepo from "./SurveySchedulesRepo";
import TagsRepo from "./TagsRepo";
import TweetsRepo from "./TweetsRepo";
import UltraFeedEventsRepo from "./UltraFeedEventsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";
import BookmarksRepo from "./BookmarksRepo";

declare global {
  type AllRepos = typeof allRepos;
  type RepoName = keyof AllRepos;
  type RepoInstance<T extends RepoName> = InstanceType<AllRepos[T]>;
  type Repos = {
    [K in RepoName]: RepoInstance<K>;
  }
}

const allRepos = {
  bookmarks: BookmarksRepo,
  clientIds: ClientIdsRepo,
  collections: CollectionsRepo,
  comments: CommentsRepo,
  conversations: ConversationsRepo,
  curationEmails: CurationEmailsRepo,
  databaseMetadata: DatabaseMetadataRepo,
  debouncerEvents: DebouncerEventsRepo,
  electionCandidates: ElectionCandidatesRepo,
  electionVotes: ElectionVotesRepo,
  forumEvents: ForumEventsRepo,
  jargonTerms: JargonTermsRepo,
  localgroups: LocalgroupsRepo,
  lwEvents: LWEventsRepo,
  manifoldProbabilitiesCachesRepo: ManifoldProbabilitiesCachesRepo,
  notifications: NotificationsRepo,
  pageCaches: PageCacheRepo,
  postEmbeddings: PostEmbeddingsRepo,
  postRecommendations: PostRecommendationsRepo,
  postRelations: PostRelationsRepo,
  posts: PostsRepo,
  postViews: PostViewsRepo,
  postViewTimes: PostViewTimesRepo,
  readStatuses: ReadStatusesRepo,
  recommendationsCaches: RecommendationsCachesRepo,
  reviewWinnerArts: ReviewWinnerArtsRepo,
  reviewWinners: ReviewWinnersRepo,
  revisions: RevisionsRepo,
  sequences: SequencesRepo,
  sideComments: SideCommentCachesRepo,
  splashArtCoordinates: SplashArtCoordinatesRepo,
  spotlights: SpotlightsRepo,
  surveys: SurveysRepo,
  surveySchedules: SurveySchedulesRepo,
  tags: TagsRepo,
  tweets: TweetsRepo,
  ultraFeedEvents: UltraFeedEventsRepo,
  users: UsersRepo,
  votes: VotesRepo,
} as const;

/**
 * The main `ResolverContext` type has a property called `repos` of type
 * `Repos` (ie; a map from repo names to repo instances). However, _most_
 * requests do not use _most_ of the repos, and there's a lot of repos
 * which need to be instantiated for every request. To avoid wasting
 * resources we instead replace the plain `repos` object with this proxy which
 * intercepts accesses to repos and only instantiates repos as-and-when
 * they're actually used. The garbage collector will be very thankful.
 */
const getAllRepos = (): Repos => new Proxy({} as Repos, {
  get<N extends RepoName>(target: Partial<Repos>, repoName: N) {
    if (!target[repoName]) {
      if (!(repoName in allRepos)) {
        throw new Error(`Invalid repo name: ${repoName}`);
      }
      target[repoName] = new allRepos[repoName] as AnyBecauseHard;
    }

    return target[repoName];
  }
});

export {
  getAllRepos,
};
