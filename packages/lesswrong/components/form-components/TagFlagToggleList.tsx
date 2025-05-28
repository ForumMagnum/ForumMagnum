import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import * as _ from 'underscore';
import DeferRender from '../common/DeferRender';
import { UpdateCurrentValues } from '../vulcan-forms/propTypes';
import Loading from "../vulcan-core/Loading";
import TagFlagItem from "../tagging/TagFlagItem";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagFlagFragmentMultiQuery = gql(`
  query multiTagFlagTagFlagToggleListQuery($selector: TagFlagSelector, $limit: Int, $enableTotal: Boolean) {
    tagFlags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagFlagFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  
});

const TagFlagToggleList = ({ value, path, updateCurrentValues }: {
  value: string[],
  path: string,
  updateCurrentValues: UpdateCurrentValues,
}) => {
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

  const { data, loading } = useQuery(TagFlagFragmentMultiQuery, {
    variables: {
      selector: { allTagFlags: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.tagFlags?.results;

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

export default registerComponent("TagFlagToggleList", TagFlagToggleList, {styles});


