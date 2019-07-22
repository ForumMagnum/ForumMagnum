// TODO; doc
// https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
// 1-4 indicate query is in flight
export function queryIsUpdating (networkStatus) {
  return [1, 2, 3, 4].includes(networkStatus)
}
