export const TestCollection2DefaultFragment = `
  fragment TestCollection2DefaultFragment on TestCollection2 {
    _id
    data
  }
`

export const TestCollection3DefaultFragment = `
  fragment TestCollection3DefaultFragment on TestCollection3 {
    _id
    notNullData
  }
`

export const TestCollection4DefaultFragment = `
  fragment TestCollection4DefaultFragment on TestCollection4 {
    _id
    testCollection3Id
    testCollection3 {
      ...TestCollection3DefaultFragment
    }
  }
`

export const TestCollection4ArgFragment = `
  fragment TestCollection4ArgFragment on TestCollection4 {
    _id
    testCollection2(testCollection2Id: $testCollection2Id) {
      ...TestCollection2DefaultFragment
    }
  }
`
