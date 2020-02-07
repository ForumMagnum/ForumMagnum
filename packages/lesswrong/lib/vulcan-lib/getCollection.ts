
export const Collections: Array<any> = [];

export const getCollection = (name: string): any =>
  Collections.find(
    ({ options: { collectionName } }) =>
      name === collectionName || name === collectionName.toLowerCase()
  );
