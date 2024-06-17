// Simple utility to check if a network status means the associated apollo query is updating
//
// https://github.com/apollographql/apollo-client/blob/main/src/core/networkStatus.ts
// 1-4 indicate query is in flight
// We deliberately ignore 6, which is merely a polling query and should not
// indicate likelihood of updating.
export function queryIsUpdating (networkStatus: number): boolean {
  return [1, 2, 3, 4].includes(networkStatus)
}
