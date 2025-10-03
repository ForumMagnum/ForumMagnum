
export function getEmbeddedStyleLoaderScript() {
  return `_embedStyles=function(name,priority,css) {
    const styleNode = document.createElement("style");
    styleNode.append(document.createTextNode(css));
    styleNode.setAttribute("data-name", name);
    styleNode.setAttribute("data-priority", priority);

    const startNode = document.getElementById('jss-insertion-start');
    const endNode = document.getElementById('jss-insertion-end');
  
    if (!startNode || !endNode) {
      throw new Error('Insertion point markers not found');
    }
  
    styleNode.setAttribute('data-priority', priority.toString());
    styleNode.setAttribute('data-name', name);
    if (!window.serverInsertedStyleNodes) {
      window.serverInsertedStyleNodes = [];
    }
    window.serverInsertedStyleNodes.push(styleNode);
  
    const styleNodes = Array.from(document.querySelectorAll('style[data-priority]'));
    let left = 0;
    let right = styleNodes.length - 1;
  
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midNode = styleNodes[mid];
      const midPriority = parseInt(midNode.getAttribute('data-priority') || '0', 10);
      const midName = midNode.getAttribute('data-name') || '';
    
      if (midPriority < priority || (midPriority === priority && midName < name)) {
        left = mid + 1;
      } else if (midPriority > priority || (midPriority === priority && midName > name)) {
        right = mid - 1;
      } else {
        // Equal priority and name, insert after this node
        midNode.insertAdjacentElement('afterend', styleNode);
        return;
      }
    }
  
    // If we didn't find an exact match, insert at the position determined by 'left'
    if (left === styleNodes.length) {
      // Insert before the end marker
      endNode.insertAdjacentElement('beforebegin', styleNode);
    } else if (left === 0) {
      // Insert after the start marker
      startNode.insertAdjacentElement('afterend', styleNode);
    } else {
      // Insert before the node at the 'left' index
      styleNodes[left].insertAdjacentElement('beforebegin', styleNode);
    }
  }`
}

