import { useState, useMemo, useEffect } from 'react'
import { EditorUserMode } from '../utils/constants'

export function useEditorStateValues() {
  const { editorState } = useEditorState()

  const [userMode, setUserMode] = useState<EditorUserMode>(editorState.userMode)

  const isSuggestionMode = useMemo(() => {
    return userMode === EditorUserMode.Suggest
  }, [userMode])

  const { suggestionsEnabled } = useSyncedState()

  useEffect(() => {
    return editorState.subscribeToProperty('userMode', (newUserMode) => {
      setUserMode(newUserMode)
    })
  }, [editorState])

  return { userMode, isSuggestionMode, suggestionsEnabled }
}
