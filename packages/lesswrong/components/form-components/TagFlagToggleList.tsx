import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import * as _ from 'underscore';
import { useMulti } from '../../lib/crud/withMulti';
import DeferRender from '../common/DeferRender';

const styles = (theme: ThemeType) => ({
  
});

const TagFlagToggleList = ({ value, path, updateCurrentValues }: FormComponentProps<string[]>) => {
  const { Loading, TagFlagItem } = Components

  const handleClick = (option: string) => {    
    if (value.includes(option)) {
      void updateCurrentValues({
        [path]: _.without(value, option)
      })
    } else {
      void updateCurrentValues({
        [path]: [...value, option]
      })
    }
  }

  const { results, loading } = useMulti({
    terms: {
      view: "allTagFlags"
    },
    collectionName: "TagFlags",
    fragmentName: 'TagFlagFragment',
    enableTotal: false,
    limit: 100,
  });

  if (loading) return <Loading />
  return <DeferRender ssr={false}><div className="multi-select-buttons">
    {results?.map(({_id}) => {
      const selected = value && value.includes(_id);
      return <a key={_id} onClick={() => handleClick(_id)}>
        <TagFlagItem documentId={_id} style={selected ? "grey" : "white"} showNumber={false} />
      </a>
    })}
  </div></DeferRender>
}

const TagFlagToggleListComponent = registerComponent("TagFlagToggleList", TagFlagToggleList, {styles});

declare global {
  interface ComponentTypes {
    TagFlagToggleList: typeof TagFlagToggleListComponent
  }
}
