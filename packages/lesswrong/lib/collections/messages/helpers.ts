import { escapeHtml } from '@/lib/utils/sanitize';

export const getDraftMessageHtml = ({ html, displayName }: {
  html: string, 
  displayName?: string
}) => {
  let newHtml = html.replace(/.*\\\\/, "")
  if (displayName) {
    const escapedDisplayName = escapeHtml(displayName)
    newHtml = newHtml.replace(/{{displayName}}/g, () => escapedDisplayName)

    const escapedFirstName = escapeHtml(displayName.split(" ")[0])
    newHtml = newHtml.replace(/{{firstName}}/g, () => escapedFirstName)
  }
  return newHtml
}
