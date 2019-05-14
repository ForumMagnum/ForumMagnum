import getHeaderSubtitleData from './modules/utils/getHeaderSubtitleData';
import qs from 'qs';

// Given the props of a component which has withRouter, return the parsed query
// from the URL.
export function parseQuery(location) {
  let query = location?.search;
  if (!query) return {};
  
  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);
    
  return qs.parse(query);
}

// Given the props of a component which has withRouter, return a subtitle for
// the page.
export function getHeaderSubtitleDataFromRouterProps(props) {
  const routeName = ""; //TODO
  const currentRoute = null; //TODO
  const query = parseQuery(props.location);
  const params = props.match.params;
  const client = props.client;
  const { subtitleText = currentRoute?.title || "", subtitleLink = "" } = getHeaderSubtitleData(routeName, query, params, client) || {};
  return { subtitleText, subtitleLink };
}