export enum MergeType {
  RemoveAccount = 'RemoveAccount',
  KeepAccount = 'KeepAccount'
}

export type MergeAction = ManualMergeAction | RunnableMergeAction

export type ManualMergeAction = {
  type: 'ManualMergeAction',
  sourceIds: string[]
}

export type RunnableMergeAction = {
  type: 'RunnableMergeAction'
  destinationId: string,
  sourceIds: string[],
  justification: 'all empty accounts' | 'only one nonempty account' | 'all accounts share the same name'
}

export type DuplicateUser = {
  _id: string,
  posts: Array<{ _id: string }>,
  comments: Array<{ _id: string }>
  matches?: {
    _id?: string,
    displayName?: string
  }
}

export type ClassifiedUser = {
  user: DuplicateUser,
  classification: MergeType
}

export function classifyDuplicateUser(user: DuplicateUser)
  : ClassifiedUser {
  if (user.comments.length == 0 && user.posts.length == 0) {
    return { user, classification: MergeType.RemoveAccount }
  }
  return { user, classification: MergeType.KeepAccount }
}

export function mergeSingleUser(userList: Array<DuplicateUser>)
  : MergeAction {
  const classifications = userList.map(classifyDuplicateUser)

  // If we only want to keep one user, we are done
  if (classifications.filter(x => x.classification == MergeType.KeepAccount).length === 1) {
    return {
      type: 'RunnableMergeAction',
      destinationId: classifications.filter(x => x.classification === MergeType.KeepAccount)[0].user['_id'],
      sourceIds: classifications.filter(x => x.classification !== MergeType.KeepAccount).map(x => x.user['_id']),
      justification: 'only one nonempty account'
    }
  }

  // If we want to remove all users, arbitrarily choose one to keep
  if (classifications.filter(x => x.classification === MergeType.KeepAccount).length === 0) {
    return {
      type: 'RunnableMergeAction',
      destinationId: classifications[0].user['_id'],
      sourceIds: classifications.slice(1).map(x => x.user['_id']),
      justification: 'all empty accounts'
    }
  }

  // Otherwise, we need to check if they all share the same name
  const keptUsers = classifications.filter(x => x.classification === MergeType.KeepAccount)
  const cleanName = x => x.user.matches?.displayName?.toLocaleLowerCase()?.replace(/\s|_/g, '')
  const keptUsersNames = keptUsers.map(cleanName)
  const allshareName = keptUsersNames.every(username => username === keptUsersNames[0])
  if (allshareName) {
    // All users have the same username, so we can merge them automatically

    return {
      type: 'RunnableMergeAction',
      destinationId: keptUsers[0].user['_id'],
      sourceIds: classifications.map(x => x.user['_id']).filter(x => x !== keptUsers[0].user['_id']),
      justification: 'all accounts share the same name'
    }
  }

  // They don't share the same name, we need to ask the user to merge
  return {
    type: 'ManualMergeAction',
    sourceIds: classifications.map(x => x.user['_id'])
  }
}
