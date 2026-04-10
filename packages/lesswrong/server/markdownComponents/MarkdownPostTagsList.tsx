
const buildTagLinks = (tags: TagBasicInfo[]): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < tags.length; i += 1) {
    if (i > 0) {
      nodes.push(", ");
    }
    const tag = tags[i];
    nodes.push(
      <a key={tag._id} href={`/w/${tag.slug}`}>
        {tag.name}
      </a>
    );
  }
  return nodes;
};

export function MarkdownPostTagsList({ post }: { post: MarkdownPostsList }) {
  const frontpageLabel = post.frontpageDate ? "Frontpage" : "Personal Blog";
  const tags = post.tags ?? [];

  return <>
    Tags: {tags.length > 0 ? buildTagLinks(tags) : "None"} ({frontpageLabel})
  </>
}
