import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { preferredHeadingCase } from '../../themes/forumTheme';
import InlineSelect, { Option } from '../common/InlineSelect';

const getSortingNames = () => ({
  'top': 'top scoring',
  'magic': 'magic (new & upvoted)',
  'newest': 'newest',
  'oldest': 'oldest',
  'recentComments': preferredHeadingCase('latest reply'),
})

const AnswersSorting = ({ post }: {
  post?: PostsList,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;
  const handleSortingClick = (opt: Option) => {
    const sorting = opt.value;
    const { query } = location;
    const currentQuery = isEmpty(query) ? { answersSorting: "top" } : query;
    const newQuery = { ...currentQuery, answersSorting: sorting, postId: post ? post._id : undefined };
    navigate({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const sortings = [...Object.keys(getSortingNames())] as (keyof ReturnType<typeof getSortingNames>)[];
  const currentSorting = query?.answersSorting || "top";
  
  const viewOptions: Array<Option> = sortings.map((view) => {
    return {value: view, label: getSortingNames()[view] || view}
  })
  const selectedOption = viewOptions.find((option) => option.value === currentSorting) || viewOptions[0]

  return <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleSortingClick}/>
};

export default AnswersSorting;


