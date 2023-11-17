export const getDraftMessageHtml = ({ html, displayName }: {
  html: string, 
  displayName?: string
}) => {
  let newHtml = html.replace(/.*\\\\/, "")
  if (displayName) {
    newHtml = newHtml.replace(/{{displayName}}/g, displayName)

    const firstName = displayName.split(" ")[0]
    newHtml = newHtml.replace(/{{firstName}}/g, firstName)
  }
  return newHtml
}
