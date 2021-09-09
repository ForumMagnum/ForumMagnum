#!/usr/bin/env node
const { MongoMemoryServer } = require('mongodb-memory-server');

// This will create an new instance of "MongoMemoryServer" and automatically start it
const mongoMemoryServer = new MongoMemoryServer({instance: {port: 27017, dbName: 'test'}}); 
mongoMemoryServer.start().then(_ => {
  mongoMemoryServer.getUri().then(uri => {
    console.log(`Mongo server running at ${uri}`);
  });
});

setInterval(() => {}, 1 << 30);
