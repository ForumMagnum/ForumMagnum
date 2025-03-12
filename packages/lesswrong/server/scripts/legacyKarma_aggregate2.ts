import Users from '../../server/collections/users/collection';

export const fixLegacyKarma = async () => {
  const response = await Users.aggregate(
    [
        {
            "$addFields" : {
                "legacyKarma" : {
                    "$add" : [
                        {
                            "$multiply" : [
                                10.0,
                                {
                                    "$subtract" : [
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_ups_link_lesswrong"
                                            ]
                                        },
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_downs_link_lesswrong"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "$multiply" : [
                                1.0,
                                {
                                    "$subtract" : [
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_ups_comment_lesswrong"
                                            ]
                                        },
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_downs_comment_lesswrong"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "$multiply" : [
                                1.0,
                                {
                                    "$subtract" : [
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_ups_link_discussion"
                                            ]
                                        },
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_downs_link_discussion"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "$multiply" : [
                                1.0,
                                {
                                    "$subtract" : [
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_ups_comment_discussion"
                                            ]
                                        },
                                        {
                                            "$multiply" : [
                                                1.0,
                                                "$legacyData.karma_downs_comment_discussion"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        {
          "$out": "users"
        }
    ]
  )
  //eslint-disable-next-line no-console
  console.log("Updated legacyKarma: ", response) 
}
