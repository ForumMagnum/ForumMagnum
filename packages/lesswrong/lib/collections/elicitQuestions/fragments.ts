import { frag } from "@/lib/fragments/fragmentWrapper";

export const ElicitQuestionFragment = () => gql`
  fragment ElicitQuestionFragment on ElicitQuestion {
    _id
    title
    notes
    resolution
    resolvesBy
  }
`;
