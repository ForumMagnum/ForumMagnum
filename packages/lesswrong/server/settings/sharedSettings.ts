export const sharedSettings = {
  forum: {
    numberOfDays: 10,
    postInterval: 30,
    numberOfWeeks: 4,
    numberOfYears: 4,
    maxPostsPerDay: 5,
    numberOfMonths: 4
  },
  type3: {
    cutoffDate: "2023-07-01",
    explicitlyAllowedPostIds: []
  },
  locale: "en-US",
  mapbox: {
    apiKey: "pk.eyJ1IjoiaGFicnlrYSIsImEiOiJjaWxvcnhidzgwOGlodHJrbmJ2bmVmdjRtIn0.inr-_5rWOOslGQxY8iDFOA"
  },
  petrov: {
    afterTime: 1727400080403,
    beforeTime: 1727376805595,
    petrovPostId: "6LJ6xcHEjKF9zWKzs",
    petrovServerUrl: "https://forum.effectivealtruism.org/graphql",
    petrovGamePostId: "KTEciTeFwL2tTujZk"
  },
  reacts: {
    addNewReactKarmaThreshold: 10,
    downvoteExistingReactKarmaThreshold: 20,
    addNameToExistingReactKarmaThreshold: 5
  },
  stripe: {
    publicKey: "pk_live_51HtKAwA2QvoATZCZiy9f2nc6hA52YS1BE81cFu9FEV1IKar0Bwx6hIpxxxYHnhaxO9KM7kRYofZId3sUUI7Q0NeO00tGni3Wza"
  },
  algolia: {
    appId: "fakeAppId",
    searchKey: "fakeSearchKey",
    indexPrefix: "test_"
  },
  llmChat: {
    userIds: [
      "McgHKH6MMYSnPwQcm",
      "6Fx2vQtkYSZkaCvAg",
      "MEu8MdhruX5jfGsFQ",
      "YaNNYeR5HjKLDBefQ",
      "hBEAsEpoNHaZfefxR",
      "NFmcwmaFeTWfgrvBN",
      "ZnpELPxzzD2CiigNy",
      "Q7NW4XaWQmfPfdcFj",
      "NXeHNNSFHGESrYkPv",
      "QDNJ93vrjoaRBesk2",
      "iMBN2523tmh4Yicc3",
      "5iPRfSnjako6iM6LG",
      "aBHfQ4C5fSM4TPyTn",
      "n4M37rPXGyL6p8ivK",
      "e9ToWWzhwWp5GSE7P",
      "TCjNiBLBPyhZq5BuM",
      "XLwKyCK7JmC292ZCC",
      "S3ydcLKdejjkodNut",
      "ENgxBL95Sc7MRwYty",
      "KCExMGwS2ETzN3Ksr",
      "XGEcH5rmq4yGvD82A",
      "YFiFbXgjBpDKZT93g",
      "dZMo8p7fGCgPMfdfD",
      "Pdca6FNZBrXj9z28n",
      "LHbu27FubhwFv8ZJt",
      "gYxdDBQ3AZbde8HgZ",
      "5JqkvjdNcxwN8D86a",
      "6c2KCEXTGogBZ9KoE",
      "haTrhurXNmNN8EiXc",
      "cJnvyeYrotgZgfG8W"
    ]
  },
  logoUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1498011194/LessWrong_Logo_skglnw.svg",
  ckEditor: {
    uploadUrl: "https://39669.cke-cs.com/easyimage/upload/",
    webSocketUrl: "39669.cke-cs.com/ws"
  },
  recombee: {
    enabled: true
  },
  hasEvents: true,
  logRocket: {
    apiKey: "mtnxzn/lesswrong",
    sampleDensity: 5
  },
  reCaptcha: {
    apiKey: "6LfFgqEUAAAAAHKdMgzGO-1BRBhHw1x6_8Ly1cXc"
  },
  siteImage: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1654295382/new_mississippi_river_fjdmww.jpg",
  cloudinary: {
    cloudName: "lesswrong-2-0",
    uploadPresetBanner: "navcjwf7",
    uploadPresetGridImage: "tz0mgw2s",
    uploadPresetSocialPreview: "nn5tppry"
  },
  googleMaps: {
    apiKey: "AIzaSyA3C48rl26gynG3qIuNuS-3Bh_Zz9jFXkY"
  },
  adminAccount: {
    email: "team@lesswrong.com",
    username: "LessWrong"
  },
  annualReview: {
    end: "2024-02-01T08:00:00Z",
    start: "2023-12-04T00:10:00Z",
    reviewPhaseEnd: "2024-01-15T08:00:00Z",
    votingPhaseEnd: "2024-02-01T08:00:00Z",
    nominationPhaseEnd: "2023-12-17T08:00:00Z",
    votingResultsPostId: "TSaJ9Zcvc3KWh3bjX",
    announcementPostPath: "/posts/B6CxEApaatATzown6/the-lesswrong-2022-review",
    reviewWinnerSectionsInfo: {
      modeling: {
        tag: "World Modeling",
        order: 2,
        title: "World",
        coords: {
          leftXPct: 0.05,
          leftYPct: 0,
          rightXPct: 0.57,
          rightYPct: 0,
          middleXPct: 0.31,
          middleYPct: 0,
          leftFlipped: true,
          leftWidthPct: 0.26,
          rightWidthPct: 0.26,
          middleWidthPct: 0.26
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753450/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_15ba02c3-b268-45f1-a780-322bbaa6fc22_eu9l0l.png"
      },
      "ai safety": {
        tag: "AI",
        order: 5,
        title: "Technical AI Safety",
        coords: {
          leftXPct: 0.2,
          leftYPct: 0.3,
          rightXPct: 0.554,
          rightYPct: 0.3,
          middleXPct: 0.467,
          middleYPct: 0.3,
          leftFlipped: false,
          leftWidthPct: 0.267,
          rightFlipped: true,
          middleFlipped: false,
          rightWidthPct: 0.267,
          middleWidthPct: 0.267
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1708570131/lwbot_topographic_watercolor_artwork_of_a_giant_robot_hand_gent_e4e9f305-9611-4787-8768-d7af3d702ed4_ta2ii9.png"
      },
      practical: {
        tag: "Practical",
        order: 3,
        title: "Practical",
        coords: {
          leftXPct: 0.2,
          leftYPct: 0.05,
          rightXPct: 0.634,
          rightYPct: 0.05,
          middleXPct: 0.417,
          middleYPct: 0.05,
          leftFlipped: false,
          leftWidthPct: 0.217,
          rightWidthPct: 0.217,
          middleWidthPct: 0.217
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708974564/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_4f6449e2-569b-48a3-b878-a400315b3ef0_hqutxe.png"
      },
      "ai strategy": {
        tag: "AI",
        order: 4,
        title: "AI Strategy",
        coords: {
          leftXPct: 0,
          leftYPct: 0,
          rightXPct: 0.66,
          rightYPct: 0,
          middleXPct: 0.33,
          middleYPct: 0,
          leftFlipped: false,
          leftWidthPct: 0.33,
          rightFlipped: true,
          middleFlipped: false,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753570/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_8dda30ee-71d6-4b24-80c7-a8499a5b25c6_uacvgk.png"
      },
      rationality: {
        tag: "Rationality",
        order: 0,
        title: "Rationality",
        coords: {
          leftXPct: 0.12,
          leftYPct: 0,
          rightXPct: 0.72,
          rightYPct: 0,
          middleXPct: 0.42,
          middleYPct: 0,
          leftFlipped: false,
          leftWidthPct: 0.3,
          rightFlipped: true,
          rightWidthPct: 0.3,
          middleWidthPct: 0.3
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753260/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_09275054-eb84-43c4-9cfa-4a05e1818c9e_rmov5i.png"
      },
      optimization: {
        tag: "World Optimization",
        order: 1,
        title: "Optimization",
        coords: {
          leftXPct: 0.1,
          leftYPct: 0.2,
          rightXPct: 0.7,
          rightYPct: 0.2,
          middleXPct: 0.4,
          middleYPct: 0.2,
          leftWidthPct: 0.33,
          rightFlipped: true,
          middleFlipped: false,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1708753382/ohabryka_Aquarelle_sketch_by_Thomas_W._Schaller_inspired_by_top_242eda7f-95a9-4c3b-8090-991a1b11286f_xcjhxq.png"
      }
    },
    reviewWinnerYearGroupsInfo: {
      2018: {
        tag: null,
        coords: {
          leftXPct: 0.01,
          leftYPct: 0.1,
          rightXPct: 0.72,
          rightYPct: 0.1,
          middleXPct: 0.34,
          middleYPct: 0.1,
          leftFlipped: false,
          leftWidthPct: 0.33,
          rightFlipped: false,
          middleFlipped: false,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008323/ruby37_green_on_white_aquarelle_sketch_by_thomas_schaller_of_ri_7a3fa89a-ac7a-466f-929f-b396cb4d9bd5_p8rh9t.png"
      },
      2019: {
        tag: null,
        coords: {
          leftXPct: 0.01,
          leftYPct: 0.1,
          rightXPct: 0.72,
          rightYPct: 0.1,
          middleXPct: 0.34,
          middleYPct: 0.1,
          leftFlipped: false,
          leftWidthPct: 0.33,
          rightFlipped: false,
          middleFlipped: false,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008331/ruby37_blue_on_white_aquarelle_sketch_by_thomas_schaller_of_gre_f421cc99-2bb5-4357-b164-d05c2f4fe84e_aib1co.png"
      },
      2020: {
        tag: null,
        coords: {
          leftXPct: 0.01,
          leftYPct: 0.01,
          rightXPct: 0.72,
          rightYPct: 0.01,
          middleXPct: 0.34,
          middleYPct: 0.01,
          leftFlipped: false,
          leftWidthPct: 0.33,
          rightFlipped: false,
          middleFlipped: false,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008346/ruby37_aquarelle_sketch_of_futuristic_landscape_by_thomas_schal_f07d5805-9fb0-4dcc-9295-7f063624e28c_slcokh.png"
      },
      2021: {
        tag: null,
        coords: {
          leftXPct: 0.01,
          leftYPct: 0.1,
          rightXPct: 0.545,
          rightYPct: 0.1,
          middleXPct: 0.278,
          middleYPct: 0.1,
          leftFlipped: false,
          leftWidthPct: 0.267,
          rightFlipped: false,
          middleFlipped: false,
          rightWidthPct: 0.267,
          middleWidthPct: 0.267
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/a_270/q_auto,f_auto/ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413"
      },
      2022: {
        tag: null,
        coords: {
          leftXPct: 0,
          leftYPct: 0.1,
          rightXPct: 0.79,
          rightYPct: 0.1,
          middleXPct: 0.43,
          middleYPct: 0.1,
          leftFlipped: false,
          leftWidthPct: 0.33,
          rightFlipped: true,
          rightWidthPct: 0.33,
          middleWidthPct: 0.33
        },
        imgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709008351/ruby37_aquarelle_sketch_of_a_woman_focusing_hard_studying_in_an_2ac568ef-408e-4561-acc8-84c76bb42fba_gwt8uq.png"
      }
    },
    showReviewOnFrontPageIfActive: true
  },
  googleVertex: {
    enabled: false
  },
  intercomAppId: "wtb8z7sj",
  commentInterval: 15,
  googleDocImport: {
    enabled: true
  },
  moderationEmail: "team@lesswrong.com",
  timeDecayFactor: 1.15,
  googleTagManager: {
    apiKey: "GTM-TRC765W"
  },
  textReplacements: {
    "Less Wrong": "Down Bad",
    "Alignment Forum": "Standards Committee",
    "Artificial Intelligence": "Fake News"
  },
  alternateHomePage: false,
  gatherTownMessage: "Schelling social hours on Tues 1pm and Thurs 6pm PT",
  bookDisplaySetting: false,
  gardenOpenToPublic: false,
  karmaRewarderId100: "iqWr6C3oEB4yWpzn5",
  legacyRouteAcronym: "lw",
  maxRenderQueueSize: 3,
  recommendationsTab: {
    manuallyStickiedPostIds: []
  },
  frontpageScoreBonus: 0,
  karmaRewarderId1000: "mBBmKWkmw8bgJmGiG",
  lightconeFundraiser: {
    active: false,
    postId: "5n2ZQcbc7r4R8mvqc",
    paymentLinkId: "plink_1QPdGLBlb9vL5IMTvkJ3LZ6v",
    unsyncedAmount: 2082623.2,
    thermometerBgUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/q_auto,f_auto,h_400/v1732869999/Group_1_b4ap4h.png",
    thermometerGoalAmount: 1000000,
    thermometerGoal2Amount: 2000000
  },
  defaultVisibilityTags: [
    {
      tagId: "Ng8Gice9KNkncxqcj",
      tagName: "Rationality",
      filterMode: 10
    },
    {
      tagId: "3uE2pXvbcnS9nnZRE",
      tagName: "World Modeling",
      filterMode: 10
    }
  ],
  enableGoodHeartProject: false,
  maxDocumentsPerRequest: 5000,
  defaultSequenceBannerId: "sequences/vnyzzznenju0hzdv6pqb.jpg",
  defaultModeratorComments: [
    {
      id: "FfMok764BCY6ScqWm",
      label: "Option A"
    },
    {
      id: "yMHoNoYZdk5cKa3wQ",
      label: "Option B"
    }
  ],
  newUserIconKarmaThreshold: 50,
  dialogueMatchmakingEnabled: true,
  hideUnreviewedAuthorComments: "2023-04-04T18:54:35.895Z",
  gatherTownUserTrackingIsBroken: true,
  postModerationWarningCommentId: "sLay9Tv65zeXaQzR4",
  commentModerationWarningCommentId: "LbGNE5Ssnvs6MYnLu",
  firstCommentAcknowledgeMessageCommentId: "QgwD7PkQHFp3nfhjj"
};
