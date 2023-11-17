export const CollectionFilters = {
  Books: {
    _id: {
      $nin: [
        '6Q3mmK9fhmdKaBrY3', 'Rx4hyKAWtog53QDGr', 'WduErZaMAQbNJTLcH', '85M373Ba5khcc2nhW', 'DrNyiLCoJDCyS3uk5', '3uNPScYM4QRGdSwD5', 'Z7ouzgFFo7a7FyfWw', 'YFbFiscrXRmkc4MR3', 'Qu3T4SEPJPTQSe5sg',
        'yJAKGfRiL4G3gFez6', 'ahWKaYXSMztvTcxKT', 'Aj9mYd7DP5WyY36eQ', '48bqzCJSZbNuyjxpH', 'gXNG4q5QmA7c28gjm', 'Db6yctmze5bPEkNod', 'KRMRDYPZyuJ7iXypi', 'v6qSg7xJ4yrmZ7JeL', 'Xmb4uNGofwkZK8AHW',
        'ZNDcjbf2YKiCYCEJr', '5Zo2ud7THof2Mp7T6', 'gP59pkF4DY6PuTBbw', 'j5MbdQtCspai4ASmw', 'aemgZa7d7vhNj6GvY', 'TtohJQBWapEhyhce3', 'A9NkrQZDN3rkujSKf', '3RqWcf6k3obJhR2Gn', 'FKqfyLN3K9JbWqcJR'
      ]
    }
  },
  Sequences: {
    $nor: [
      {
        $and: [
          {
            _id: {
              $in: [
                "ni3zmxv472whorWuZ","abwJLsSMAt7AMwrsA","WhZyfSa9RtPXEBjrR","jGid58WsTTsYcHqKZ","DdEwjiHgu6T4YaKhn","ndw2bPx2jYCgSoZFc","nc8hB2fynFPRZYecn","9Z2oJgkf7nd4ejPC3","2qi7gyDXLz2EEr6sD",
                "Srihgh6BPPpBcWoy4","ay6abSNrE9PCQuviy","GB2P6x9bZJue2NF8t","Nm7nCmn4P7XJ9Aarn","DgceNjEBefrqP3v8Z","QPgQWvdigqaZafmQX","gCX3je2BmvE3FvE43","2Pwz6nv3aWoqnYiQA","bt6yb3mwC2Fuc3WKN",
                "dm4bhSKRABon7n8cX","wKJady82pK9tEgicw","EP69QjXWBokBKSTFv","LFy2F8uEm8m9CN33u","rNuPrZvabXe2MaZv8","3jqkTiAQkjKdCb6B7","prZQcis6iHp9fuRyj","DGBB8Bkx8ujk8dzhW","G3cMk7e5DH8s75tvf"
              ],
            },
          },
          {
            isDeleted: true,
          },
        ],
      },
    ],
  },

};
