
export function MarkdownUserLink({user}: {
  user: {slug: string, displayName: string}|null
}) {
  if (!user) return <span>[Anonymous]</span>
  return <a href={`/users/${user.slug}`}>{user.displayName}</a>
}
