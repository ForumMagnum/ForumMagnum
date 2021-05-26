
declare module 'bson-stream' {
  const BSONStream: new ()=>NodeJS.ReadWriteStream
  export default BSONStream
}
declare module 'pg-sync' {
  const pgsync: any
  export default pgsync
}

