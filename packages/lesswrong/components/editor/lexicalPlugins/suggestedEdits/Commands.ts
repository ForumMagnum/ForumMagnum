import type { LexicalCommand } from 'lexical'
import { createCommand } from 'lexical'
import type { EditorUserModeType } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode'

export const ACCEPT_SUGGESTION_COMMAND: LexicalCommand<string> = createCommand('ACCEPT_SUGGESTION_COMMAND')
export const REJECT_SUGGESTION_COMMAND: LexicalCommand<string> = createCommand('REJECT_SUGGESTION_COMMAND')
export const SET_USER_MODE_COMMAND: LexicalCommand<EditorUserModeType> = createCommand('SET_USER_MODE_COMMAND')
