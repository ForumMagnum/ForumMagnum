import { useNamedMutation } from '../../lib/crud/withMutation';

export const useSetAlignmentPost = ({fragmentName}: {fragmentName: FragmentName}) => {
  const {mutate} = useNamedMutation<{
    postId: string, af: boolean,
  }>({
    name: "alignmentPost",
    graphqlArgs: {postId: "String", af: "Boolean"},
    fragmentName,
  });
  return {setAlignmentPostMutation: mutate};
}
