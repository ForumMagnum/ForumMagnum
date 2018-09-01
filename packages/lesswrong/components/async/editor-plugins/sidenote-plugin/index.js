import Sidenote from './Sidenote';
import SidenoteButton from './SidenoteButton'

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

const createSidenotePlugin = () => {

  const store = {
    getEditorState: undefined,
    setEditorState: undefined
  };

  return {
    initialize: ({ getEditorState, setEditorState }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },
    decorators: [ sidenoteDecorator ],
    SidenoteButton
  };

};

export default createSidenotePlugin
