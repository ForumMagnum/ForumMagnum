interface SearchableLocalGroup {
  name: string
  nameInAnotherLanguage?: string | null
  location?: string | null
}

const normalizeSearchText = (text: string) => text.trim().toLocaleLowerCase()

export const localGroupMatchesSearch = (group: SearchableLocalGroup, searchQuery: string) => {
  const searchTerms = normalizeSearchText(searchQuery).split(/\s+/).filter(Boolean)
  if (!searchTerms.length) return true

  const searchableText = normalizeSearchText([
    group.name,
    group.nameInAnotherLanguage,
    group.location,
  ].filter(Boolean).join(" "))

  return searchTerms.every(term => searchableText.includes(term))
}
