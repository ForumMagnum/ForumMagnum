
export const Collections: Array<any> = [];

export const getCollection = name =>
  Collections.find(
    ({ options: { collectionName } }) =>
      name === collectionName || name === collectionName.toLowerCase()
  );
