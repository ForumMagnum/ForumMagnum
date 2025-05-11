import React from "react";
import { Helmet } from "../../lib/utils/componentsWithChildren";
import { registerComponent } from "../../lib/vulcan-lib/components";

/**
 * This component adds citation meta tags for use by sites such as Google Scholar.
 *
 * There are several different standards in use for citation tags - for now we're
 * just using the 'Highwire Press' standard which seems to be the most widespread,
 * but others could be added in the future if required (other popular options are
 * 'Eprints', 'BE Press', 'PRISM' and 'Dublin Core').
 *
 * The primary author is separate from the coauthors as, even though Highwire Press
 * doesn't make a distinction, some of the other formats do.
 */
const CitationTags = ({title, author, coauthors, date}: {
  title?: string,
  author?: string,
  coauthors?: string[],
  date?: string | Date,
}) => {
  if (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    date = date.toISOString();
    date = date.slice(0, date.indexOf("T")).replace(/-/g, "/");
  }
  return (
    <Helmet>
      {title && <meta name="citation_title" content={title} />}
      {author && <meta name="citation_author" content={author} />}
      {coauthors && coauthors.map((coauthor, index) =>
        <meta name="citation_author" content={coauthor} key={index} />
      )}
      {date && <meta name="citation_publication_date" content={date} />}
    </Helmet>
  );
}

export default registerComponent("CitationTags", CitationTags);


