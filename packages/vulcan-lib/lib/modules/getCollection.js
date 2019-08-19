
export const Collections = [];

export const getCollection = name =>
  Collections.find(
    ({ options: { collectionName } }) =>
      name === collectionName || name === collectionName.toLowerCase()
  );
