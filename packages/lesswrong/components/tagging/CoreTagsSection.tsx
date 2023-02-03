import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "grid",
    // tags flow into grid with 2 per row on large screens, 1 per row on small screens
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gridGap: "8px",
  },
});

const CoreTagsSection = ({classes}: {
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms: {
      view: "coreTags",
      limit: 100,
    },
    collectionName: "Tags",
    fragmentName: "TagFragment", // TODO: make a CoreTagFragment
    enableTotal: false,
  });

  const { CoreTagCard } = Components;

  return (
    <div className={classes.root}>
      {results?.map((tag) => (
        <CoreTagCard key={tag._id} tag={tag} />
      ))}
    </div>
  );
}

const CoreTagsSectionComponent = registerComponent("CoreTagsSection", CoreTagsSection, {styles});

declare global {
  interface ComponentTypes {
    CoreTagsSection: typeof CoreTagsSectionComponent
  }
}
