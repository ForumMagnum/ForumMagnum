import qs from 'qs';

// Given the props of a component which has withRouter, return the parsed query
// from the URL.
export function parseQuery(props) {
  let query = props?.location?.search;
  if (!query) return {};
  
  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);
    
  return qs.parse(query);
}
