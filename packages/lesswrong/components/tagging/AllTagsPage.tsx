import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';

const styles = theme => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  alphabetical: {
    columns: 5,
    columnWidth: 200,
    columnGap: 0,
    background: "white",
    padding: 20,
    marginBottom: 24  
  }
})

const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { results, loadMoreProps, totalCount, count } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collection: Tags,
    fragmentName: "TagPreviewFragment",
    limit: 20,
    itemsPerPage: 100,
    ssr: true
  });
  const { AllTagsAlphabetical, TagsDetailsItem, SectionTitle, LoadMore } = Components;
  
  return (
    <div className={classes.root}>
      <AllTagsAlphabetical />
      <SectionTitle title="Tag Details"/>
      <div>
        {results && results.map(tag => {
          return <TagsDetailsItem key={tag._id} tag={tag} />
        })}
        {results && !results.length && <div>
          There aren't any tags yet.
        </div>}
      </div>
      <LoadMore 
        {...loadMoreProps} 
        totalCount={totalCount}
        count={count}
      />
    </div>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
