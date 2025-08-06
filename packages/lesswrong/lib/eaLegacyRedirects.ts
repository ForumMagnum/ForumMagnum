/**
 * Add some special-case redirects for things that are referenced on other
 * sites but have since moved.
 */
export const eaLegacyRedirects: {from: string, to: string}[] = [
  // Giving season
  {from: "/giving-portal", to: "/posts/j6fmnYM5ZRu9fJyrq/donation-election-how-to-vote"},
  {from: "/voting-portal", to: "/posts/j6fmnYM5ZRu9fJyrq/donation-election-how-to-vote"},

  // Oxford Prioritisation Project posts
  {from: "/ea/1ae/a_model_of_the_machine_intelligence_research", to: "/topics/oxford-prioritisation-project"},
  {from: "/ea/1fn/oxford_prioritisation_project_review", to: "/topics/oxford-prioritisation-project"},
  {from: "/ea/1ah/four_quantiative_models_aggregation_and_final", to: "/topics/oxford-prioritisation-project"},

  // Misc posts
  {from: "/ea/7k/what_small_things_can_an_ea_do", to: "https://www.effectivealtruism.org/take-action"},
  {from: "/ea/6x/introduction_to_effective_altruism", to: "https://www.effectivealtruism.org/articles/introduction-to-effective-altruism"},
  {from: "/r/main/ea/xn/givewell_money_moved_in_2015_a_review_of_my", to: "/posts/qKah99saPajei6ERi"},
  {from: "/r/vipulnaik-drafts/ea/xn/givewell_money_moved_in_2015_a_review_of_my", to: "/posts/qKah99saPajei6ERi"},
  {from: "/posts/wtQ3XCL35uxjXpwjE/ea-survey-2019-series-community-demographics-and", to: "/posts/wtQ3XCL35uxjXpwjE"},
  {from: "/posts/iHvvc9HHzSfHNGCHb/mental-health-resources-tailored-for-eas-wip", to: "/posts/iHvvc9HHzSfHNGCHb"},
  {from: "/ea/6v/scope_insensitivity", to: "/posts/WdmCe6dr3snACxehL/scope-insensitivity-2"},
  {from: "/posts/kftzYdmZf4nj2ExN7/bit.ly/eaunjournal", to: "/posts/kftzYdmZf4nj2ExN7"},
  {from: "/posts/98LrrRzdwZadLe2oD/bit.ly/unjournaldirect", to: "/posts/98LrrRzdwZadLe2oD"},
  {from: "/posts/cRsPfkyAKZ3crxynB/get-in-the-van", to: "/posts/cRsPfkyAKZ3crxynB"},
  {from: "/giving-now-currently-seems-beat-giving-later-2", to: "/posts/omCFSYF6MZqRFRJCv"},
  {from: "/ea/4y/excited_altruism", to: "/posts/diu9Zx44s5uZhyBru"},
  {from: "/posts/FST9XBYgbbjyN79DF/announcing-our-2023-charity-recommendations", to: "/posts/FST9XBYgbbjyN79DF"},
  {from: "/posts/2trdQRQPBED8RMbgk/review-of-fundraising-activities-of-eaf-in-2018", to: "/posts/2trdQRQPBED8RMbgk"},
  {from: "/r/main/ea/11n/reflections_on_ea_global_from_a_firsttime_attendee", to: "/posts/mMEzk55R33vvHPgyd"},
  {from: "/posts/bud2ssjlq33psemkh/my-current-impressions-on-career-choice-for-longtermists", to: "/posts/bud2ssJLQ33pSemKH"},
  {from: "/posts/%20kageSSDLSMpuwkPKK/response-to-recent-criticisms-of-%20longtermism-1", to: "/posts/kageSSDLSMpuwkPKK"},

  // Other routes
  {from: "/p", to: "/"},
  {from: "/advice", to: "/"},
  {from: "/cea-hiring", to: "/"},
  {from: "/about-2", to: "/about"},
  {from: "/category/:path", to: "/topics"},
  {from: "/history", to: "/saved#readhistory"},
  {from: "/allPosts,", to: "/allPosts"},
  {from: "/top", to: "/allPosts?sortedBy=top"},
  {from: "/node/:path", to: "/"},
  {from: "/meetups/:path", to: "/meetups"},
];
