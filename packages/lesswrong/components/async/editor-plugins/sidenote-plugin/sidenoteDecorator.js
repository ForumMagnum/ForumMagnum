import Sidenote from './Sidenote';

const matchesEntityType = (type) => type === 'SIDENOTE';

const sidenoteStrategy = (contentBlock, callback, contentState) => {
  if (!contentState) {
    return
  }

  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      matchesEntityType(contentState.getEntity(entityKey).getType())
    );
  }, callback);
}

const sidenoteDecorator = {
  strategy: sidenoteStrategy,
  matchesEntityType,
  component: Sidenote
}

export default sidenoteDecorator;
