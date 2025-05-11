import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components'
import { calendlyPreviewStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType) => ({
  calendlyEmbed: {
    ...calendlyPreviewStyles(theme)["& div.calendly-preview"]
  }
})

export const validatedCalendlyUrl = (url: string) => {
  if (url === "") return {valid: true, url: ""}
  let calendlyUrl = null
  try {
    // new URL("www.calendly.com") is a type error, so we want to add the protocol to the front if it's not there
    calendlyUrl = new URL(url.slice(0,4) === "http" ? url : `https://${url}`)
    const valid = calendlyUrl.hostname.match(/^(www\.)?calendly.com$/) !== null
    return {valid, url: valid ? calendlyUrl.toString() : url}
  } catch (e) {
    return {valid: false, url: url}
  }
}

const CalendlyIFrame = ({url, classes}: {url: string, classes: ClassesType<typeof styles>}) => {
  const valid = validatedCalendlyUrl(url)
  if (!valid.valid) return <div>Invalid Calendly URL</div>
  // The IFrame element is used in the modal, but is stripped out by CKEditor
  // We extend the MediaEmbed CKEditor plugin's config to allow Calendly.
  // It wants divs with data-oembed-url attributes, so we add that here.
  // Maybe one day they will change that and this will break.
  // See https://ckeditor.com/docs/ckeditor5/latest/features/media-embed.html#extending-media-providers
  return  <div data-oembed-url={valid.url}>
    <div className={classes.calendlyEmbed}>
      <iframe
        sandbox="allow-scripts allow-same-origin allow-forms"
        src={valid.url}
      ></iframe>
    </div>
  </div>
}

export default registerComponent('CalendlyIFrame', CalendlyIFrame, {styles});


