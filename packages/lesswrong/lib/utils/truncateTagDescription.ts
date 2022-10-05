const truncateTagDescription = (htmlWithAnchors: string, withReadMore = true) => {
  for (let matchString of [
      'id="Further_reading"',
      'id="Bibliography"',
      'id="Related_entries"',
      'class="footnotes"',
    ]) {
    if(htmlWithAnchors.includes(matchString)) {
      const truncationLength = htmlWithAnchors.indexOf(matchString);
      /**
       * The `truncate` method used below uses a complicated criterion for what
       * counts as a character. Here, we want to truncate at a known index in
       * the string. So rather than using `truncate`, we can slice the string
       * at the desired index, use `parseFromString` to clean up the HTML,
       * and then append our footer 'read more' element.
       */
      return new DOMParser().parseFromString(
          htmlWithAnchors.slice(0, truncationLength), 
          'text/html'
        ).body.innerHTML + (withReadMore ? "<span>...<p><a>(Read More)</a></p></span>" : "");
    }
  }
  return htmlWithAnchors
}

export default truncateTagDescription;
