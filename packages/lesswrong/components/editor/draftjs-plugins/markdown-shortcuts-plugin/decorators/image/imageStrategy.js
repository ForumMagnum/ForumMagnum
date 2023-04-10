const createImageStrategy = () => {
  const findImageEntities = (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'IMG'
      );
    }, callback);
  };
  return findImageEntities;
};

export default createImageStrategy;
