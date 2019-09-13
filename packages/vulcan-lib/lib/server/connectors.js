
// convert GraphQL selector into Mongo-compatible selector
// TODO: add support for more than just documentId/_id and slug, potentially making conversion unnecessary
// see https://github.com/VulcanJS/Vulcan/issues/2000
const convertSelector = selector => {
  return selector;
};
const convertUniqueSelector = selector => {
  if (selector.documentId) {
    selector._id = selector.documentId;
    delete selector.documentId;
  }
  return selector;
};

const localDebug = true

export const Connectors = {
  get: async (collection, selector = {}, options = {}, skipConversion) => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    if (localDebug && ['posts'].includes(collection._name)) {
      console.log('DB QUERY GET {')
      console.log('  COLLECTION', collection._name)
      console.log('  SELECTOR', convertedSelector)
      console.log('  OPTIONS', options)
      console.log('END GET } ---')
    }
    return await collection.findOne(convertedSelector, options);
  },
  find: async (collection, selector = {}, options = {}) => {
    if (localDebug && ['posts'].includes(collection._name)) {
      console.log('DB QUERY FIND {')
      console.log('  COLLECTION', collection._name)
      console.log('  SELECTOR', selector)
      console.log('  OPTIONS', options)
      console.log('END FIND PT 1} ====')
    }
    const documents = await collection.find(convertSelector(selector), options).fetch();
    if (localDebug && ['posts'].includes(collection._name)) {
      console.log('DB QUERY FIND RESULTS {')
      // console.log('  COLLECTION', collection._name)
      // console.log('  SELECTOR', selector)
      // console.log('  OPTIONS', options)
      console.log('  DOCUMENTS', documents.map(doc => _.pick(doc, ['title', '_id'])))
      console.log('  DOCUMENTS.LENGTH', documents.length)
      console.log('END FIND PT 2} ####')
    }
    return documents
  },
  count: async (collection, selector = {}, options = {}) => {
    return await collection.find(convertSelector(selector), options).count();
  },
  create: async (collection, document, options = {}) => {
    return await collection.insert(document);
  },
  update: async (collection, selector, modifier, options = {}, skipConversion) => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    // console.log('DB QUERY UPDATE {')
    // console.log('  COLLECTION', collection._name)
    // console.log('  SELECTOR', convertedSelector)
    // console.log('  MODIFIER', modifier)
    // console.log('  OPTIONS', options)
    // console.log('END FIND PT 1} ====')
    return await collection.update(convertedSelector, modifier, options);
  },
  delete: async (collection, selector, options = {}, skipConversion) => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    return await collection.remove(convertedSelector);
  },
}
