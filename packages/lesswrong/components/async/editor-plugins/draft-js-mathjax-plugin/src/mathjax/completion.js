import { convertToRaw } from 'draft-js'
import teXCommands from './teXCommands'

const teXCmdRegex = /\\([a-zA-Z]+)$/

const getLastTeXCommand = (teX) => {
  const res = teXCmdRegex.exec(teX)
  return res ? res[1].toLowerCase() : ''
}

const computeCompletionList = (
  cmdPrefix,
  commands,
  mostUsedCommands = {},
) => {
  if (cmdPrefix === '') {
    return []
  }
  const list = commands[cmdPrefix[0].toLowerCase()]
    .filter(cmd => cmd.toLowerCase().startsWith(cmdPrefix.toLowerCase()))

  if (!mostUsedCommands) { return list }

  list.sort((c1, c2) => {
    const w1 = (
      Object.prototype.hasOwnProperty.call(mostUsedCommands, c1) &&
      mostUsedCommands[c1]
    ) || 0
    const w2 = (
      Object.prototype.hasOwnProperty.call(mostUsedCommands, c2) &&
      mostUsedCommands[c2]
    ) || 0

    if (w1 === w2) { return 0 }
    if (w1 < w2) { return 1 }
    return -1
  })
  return list
}

function getMostUsedTeXCmds(teX) {
  const cmdRe = /\\([a-zA-Z]+)/
  let copy = teX
  const res = {}
  let search
  let cmd
  while (true) {
    search = cmdRe.exec(copy)
    if (search === null) break
    cmd = search[1]
    copy = copy.slice(search.index + cmd.length + 1)
    if (Object.prototype.hasOwnProperty.call(res, cmd)) {
      res[cmd] += 1
    } else {
      res[cmd] = 1
    }
  }

  return res
}

function getAllTeX(contentState) {
  const entityMapObj = convertToRaw(contentState).entityMap
  const entityKeys = Object.keys(entityMapObj)
  const entityMap = entityKeys.map(k => entityMapObj[k])
  // Todo: lorsque drafjs sera en version 0.11.0,
  // remplacer ce qui précède par
  // const entityMap = contentState.getBlockMap()
  const blockMap = contentState.getBlockMap()

  let allTeX = entityMap
    .filter(e => e.type === 'INLINETEX')
  // Todo: lorsque drafjs sera en version 0.11.0,
  // .filter(e => e.get('type') === 'INLINETEX');;
    .reduce((red, e) => red + e.data.teX, '')
  // Todo: lorsque drafjs sera en version 0.11.0,
  // .reduce((red, e) => red + e.get('data').teX, '')
  allTeX = blockMap
    .filter(b => b.getData().mathjax)
    .reduce((red, b) => red + b.getData().teX, allTeX)

  return allTeX
}

function getInitialMostUsedTeXCmds(editorState) {
  return getMostUsedTeXCmds(
    getAllTeX(editorState.getCurrentContent()),
  )
}

function updateMostUsedTeXCmds(
  newTeX,
  mostUsedCommands,
  lastTex,
) {
  if (!mostUsedCommands) { return undefined }
  const newest = getMostUsedTeXCmds(newTeX)
  const old = getMostUsedTeXCmds(lastTex)
  const muc = { ...mostUsedCommands }
  const nk = Object.keys(newest)
  const ok = Object.keys(old)

  // newest including newest inter old
  let nmuc = nk.reduce((red, cmd) => {
    let repeat = newest[cmd]
    const nred = { ...red }
    if (Object.prototype.hasOwnProperty.call(old, cmd)) {
      repeat -= old[cmd]
    }
    if (Object.prototype.hasOwnProperty.call(nred, cmd)) {
      nred[cmd] += repeat
    } else {
      nred[cmd] = repeat
    }
    return nred
  }, muc)

  // old not inside newest
  nmuc = ok.filter(k => (nk.indexOf(k) === -1))
    .reduce((red, cmd) => {
      const nred = { ...red }
      if (Object.prototype.hasOwnProperty.call(nred, cmd)) {
        nred[cmd] -= old[cmd]
      }
      return nred
    }, nmuc)

  // console.log(nmuc)
  return nmuc
}

function mergeMacros(teXCmds, macros) {
  return Object.keys(macros).reduce((red, m) => {
    const firstChar = m[0].toLowerCase()
    const tmp = [...red[firstChar]]
    tmp.unshift(m)
    tmp.sort()
    return { ...red, [firstChar]: tmp }
  }, { ...teXCmds })
}

export default (status, macros) => editorState => ({
  status,
  teXCommandsAndMacros: (status !== 'none') ?
    mergeMacros(teXCommands, macros) : undefined,
  mostUsedTeXCommands: (status !== 'none') ?
    getInitialMostUsedTeXCmds(editorState) : undefined,
  getLastTeXCommand,
  updateMostUsedTeXCmds(teX, lastTex = '') {
    this.mostUsedTeXCommands = updateMostUsedTeXCmds(
      teX,
      this.mostUsedTeXCommands,
      lastTex,
    )
  },
  computeCompletionList(prefix) {
    return computeCompletionList(
      prefix,
      this.teXCommandsAndMacros,
      this.mostUsedTeXCommands,
    )
  },
})
