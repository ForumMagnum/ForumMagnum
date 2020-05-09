import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import Checkbox from '@material-ui/core/Checkbox';
import { Tags } from '../../lib/collections/tags/collection';

const styles = theme => ({
  root: {
  },
  checkbox: {
    padding: 4,
  },
});

const CoreTagsChecklist = ({onSetTagsSelected, classes}: {
  onSetTagsSelected: (selectedTags: Record<string,boolean>)=>void,
  classes: ClassesType,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "coreTags",
    },
    collection: Tags,
    fragmentName: "TagFragment",
    limit: 100,
    ssr: true,
  });
  
  const { Loading } = Components;
  const [selections, setSelections] = useState<Record<string,boolean>>({});
  
  if (loading)
    return <Loading/>
  
  return <div className={classes.root}>
    {results.map(tag => <div key={tag._id}>
      <Checkbox
        className={classes.checkbox}
        checked={selections[tag._id]}
        onChange={(event, checked) => {
          const newSelections = {...selections, [tag._id]: checked};
          setSelections(newSelections);
          onSetTagsSelected(newSelections);
        }}
      />
      {tag.name}
    </div>)}
  </div>
}


const CoreTagsChecklistComponent = registerComponent("CoreTagsChecklist", CoreTagsChecklist, {styles});

declare global {
  interface ComponentTypes {
    CoreTagsChecklist: typeof CoreTagsChecklistComponent
  }
}

