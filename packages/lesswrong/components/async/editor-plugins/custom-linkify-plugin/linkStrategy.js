import linkifyIt from 'linkify-it'
import tlds from 'tlds'

const linkify = linkifyIt()
linkify.tlds(tlds)

// Gets all the links in the text, and returns them via the callback
const linkStrategy = (contentBlock, callback) => {
  console.log('linkStrategy')
  const links = linkify.match(contentBlock.get('text'))
  if (typeof links !== 'undefined' && links !== null) {
    for (let link of links) {
      callback(link.index, link.lastIndex)
    }
  }
}

export default linkStrategy
