import LWEvents from "./collection.js"

LWEvents._ensureIndex({name:1, createdAt:-1})

LWEvents._ensureIndex({documentId:1, userId:1, deleted:1, name:1, createdAt:-1})
