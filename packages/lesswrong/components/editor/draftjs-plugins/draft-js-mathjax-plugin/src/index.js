import { EditorState, Modifier } from 'draft-js'
import {
  myKeyBindingFn,
  findInlineTeXEntities,
} from './utils'
import loadMathJax from './mathjax/loadMathJax'
import initCompletion from './mathjax/completion'
import insertTeX from './modifiers/insertTeX'
import InlineTeX from './components/InlineTeX'
import TeXBlock from './components/TeXBlock'

const defaultConfig = {
  macros: {},
  completion: 'auto',
}

const createMathjaxPlugin = (config = {}) => {
  const {
    macros,
    completion,
    script,
    mathjaxConfig,
  } = Object.assign(defaultConfig, config)

  loadMathJax({ macros, script, mathjaxConfig })

  const store = {
    getEditorState: undefined,
    setEditorState: undefined,
    getReadOnly: undefined,
    setReadOnly: undefined,
    getEditorRef: undefined,
    completion: initCompletion(completion, macros),
    teXToUpdate: {},
  }

  const _insertTeX = (block = false) => {
    const editorState = store.getEditorState()
    store.setEditorState(
      insertTeX(editorState, block),
    )
  }

  const insertChar = (char) => {
    const editorState = store.getEditorState()
    const sel = editorState.getSelection()
    const offset = sel.getStartOffset() - 1
    const newContentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      sel.merge({
        anchorOffset: offset,
        focusOffset: offset + 1,
      }),
      char,
    )
    store.setEditorState(
      EditorState.push(editorState, newContentState, 'insert-characters'),
    )
  }

  const keyBindingFn = (e, { getEditorState }) =>
    myKeyBindingFn(getEditorState)(e)

  const blockRendererFn = (block) => {
    if (
      block.getType() === 'atomic' && block.getData().get('mathjax')
    ) {
      return {
        component: TeXBlock,
        editable: false,
        props: { getStore: () => store },
      }
    }
    return null
  }

  // l'utilisation des flèches gauche ou droite
  // amène le curseur sur une formule
  const updateTeX = (key, dir) => {
    // le composant associé à la formule
    // se sert de cet indicateur
    // pour se reconnaître
    // cf.componentWillReceiveProps
    store.teXToUpdate = { key, dir }
    const editorState = store.getEditorState()
    store.setEditorState(
      EditorState.forceSelection(
        editorState,
        editorState.getSelection(),
      ),
    )
  }

  const handleKeyCommand = (command /* ,{ getEditorState, setEditorState } */) => {
    if (command === 'insert-texblock') {
      _insertTeX(true)
      return 'handled'
    }
    if (command === 'insert-inlinetex') {
      _insertTeX()
      return 'handled'
    }
    // command de la forme 'enter-inline-math-<dir>-<entityKey>',
    // lancée lorsque l'utilisateur déplace le curseur
    // sur une formule à l'aide des flèches gauche/droite(dir:l ou r)
    if (command.slice(0, 16) === 'update-inlinetex') {
      const dir = command.slice(17, 18)
      const entityKey = command.slice(19)
      updateTeX(entityKey, dir)
      return 'handled'
    }
    if (command.slice(0, 15) === 'update-texblock') {
      const dir = command.slice(16, 17)
      const blockKey = command.slice(18)

      updateTeX(blockKey, dir)
      return 'handled'
    }
    if (command.slice(0, 11) === 'insert-char') {
      const char = command.slice(12)
      insertChar(char)
      return 'handled'
    }
    return 'not-handled'
  }

  return {
    initialize: ({ getEditorState, setEditorState, getReadOnly, setReadOnly, getEditorRef }) => {
      store.getEditorState = getEditorState
      store.setEditorState = setEditorState
      store.getReadOnly = getReadOnly
      store.setReadOnly = setReadOnly
      store.getEditorRef = getEditorRef
      store.completion = store.completion(getEditorState())
      // store.completion.mostUsedTeXCommands =
      //   getInitialMostUsedTeXCmds(getEditorState())
    },
    decorators: [{
      strategy: findInlineTeXEntities,
      component: InlineTeX,
      props: {
        getStore: () => store,
      },
    }],
    keyBindingFn,
    handleKeyCommand,
    blockRendererFn,
  }
}

export default createMathjaxPlugin
