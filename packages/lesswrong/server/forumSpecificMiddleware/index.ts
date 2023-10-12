import { forumSelect } from '../../lib/forumTypeUtils'
import { afMiddleware } from './afMiddleware'
import { eaMiddleware } from './eaMiddleware'
import { lwMiddleware } from './lwMiddleware'
import { wuMiddleware } from './wuMiddleware'

export const addForumSpecificMiddleware = forumSelect({
  AlignmentForum: afMiddleware,
  EAForum: eaMiddleware,
  LessWrong: lwMiddleware,
  WakingUp: wuMiddleware,
  default: () => {},
})
