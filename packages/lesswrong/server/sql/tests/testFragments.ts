import gql from "graphql-tag"

export const TestCollection2DefaultFragment = gql`
  fragment TestCollection2DefaultFragment on TestCollection2 {
    _id
    data
  }
`

export const TestCollection3DefaultFragment = gql`
  fragment TestCollection3DefaultFragment on TestCollection3 {
    _id
    notNullData
  }
`

export const TestCollection4DefaultFragment = gql`
  fragment TestCollection4DefaultFragment on TestCollection4 {
    _id
    testCollection3Id
    testCollection3 {
      ...TestCollection3DefaultFragment
    }
  }
`

export const TestCollection4ArgFragment = gql`
  fragment TestCollection4ArgFragment on TestCollection4 {
    _id
    testCollection2(testCollection2Id: $testCollection2Id) {
      ...TestCollection2DefaultFragment
    }
  }
`
