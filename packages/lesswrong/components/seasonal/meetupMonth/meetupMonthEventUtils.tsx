const ifAnyoneTitle = '<Your City Here> "If Anyone Builds It" reading group'
const petrovTitle = '<Your City Here> Petrov Day'
const solsticeTitle = '<Your City Here> Solstice'

const ifAnyoneText = `
<p><em>(Edit the title and text here to whatever makes sense for your group)</em></p>
<p>We'll be meeting to discuss [the first chapter] / [the first N chapters] of <a href="https://www.amazon.com/Anyone-Builds-Everyone-Dies-Superhuman/dp/0316595640">If Anyone Builds It, Everyone Dies</a>.</p>
<p>
Contact Info: [Your Contact Info]
</p>
<p>
Location: [Your Location]
</p>
`

const petrovText = `
<p><em>(Edit the title and text here to whatever makes sense for your group)</em></p>
<p>Join us to celebrate the day Stanislav Petrov didn't destroy the world. </p>.
<p>
Contact Info: [Your Contact Info]
</p>
<p>
Location: [Your Location]
</p>
`

const solsticeText = `
<p><em>(Edit the title and text here to whatever makes sense for your group)</em></p>
<p>Join us on the longest night of the year to celebrate humanity's struggles and triumphs.</p>.
<p>
Contact Info: [Your Contact Info]
</p>
<p>
Location: [Your Location]
</p>
`


export const getMeetupMonthInfo = (types: Array<'IFANYONE' | 'PETROV' | 'SOLSTICE'>) => {
  switch (types[0]) {
    case 'IFANYONE':
      return { title: ifAnyoneTitle, data: ifAnyoneText }
    case 'PETROV':
      return { title: petrovTitle, data: petrovText }
    case 'SOLSTICE':
      return { title: solsticeTitle, data: solsticeText }
    default:
      return { title: '', data: '' }
  }
}
