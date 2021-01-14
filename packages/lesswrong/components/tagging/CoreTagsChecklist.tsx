import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import Checkbox from '@material-ui/core/Checkbox';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 8,
    display: "flex",
    flexWrap: "wrap"
  },
  checkbox: {
    padding: "0 8px 2px 0",
    '& svg': {
      height:14,
      width: 14
    }
  },
  tag: {
    minWidth: "25%",
    display: "inline-block",
    ...theme.typography.commentStyle,
    marginRight: 16,
    color: theme.palette.grey[600],
    marginTop: 4
  }
});

const CoreTagsChecklist = ({onSetTagsSelected, classes, post}: {
  onSetTagsSelected: (selectedTags: Record<string,boolean>)=>void,
  classes: ClassesType,
  post: PostsList|SunshinePostsList
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "coreTags",
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 100,
  });
  
  const { Loading } = Components;
  const [selections, setSelections] = useState<Record<string,boolean>>({});
  if (loading)
    return <Loading/>
  
  return <div className={classes.root}>
    {results.map(tag => <span key={tag._id} className={classes.tag}>
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
    </span>)}
  </div>
}


const CoreTagsChecklistComponent = registerComponent("CoreTagsChecklist", CoreTagsChecklist, {styles});

declare global {
  interface ComponentTypes {
    CoreTagsChecklist: typeof CoreTagsChecklistComponent
  }
}

