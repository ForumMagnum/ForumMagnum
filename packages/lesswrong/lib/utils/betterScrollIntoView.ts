
function betterScrollIntoView(domNode: HTMLElement, options: {
  behavior: "smooth"|"instant"
}) {
  const rect = domNode.getBoundingClientRect()
  const bottomRelativeToViewport = rect.bottom
  const newTop = window.scrollY + bottomRelativeToViewport - window.innerHeight
  window.scrollTo({top: newTop, behavior: "smooth"})
}
