import React from "react";
import { Helmet } from "react-helmet";
import { registerComponent } from "../../lib/vulcan-lib";

const CitationTags = ({title, author, coauthors, date}: {
  title?: string,
  author?: string,
  coauthors?: string[],
  date?: string | Date,
}) => {
  if (date instanceof Date) {
    date = date.toISOString();
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

const CitationTagsComponent = registerComponent("CitationTags", CitationTags);

declare global {
  interface ComponentTypes {
    CitationTags: typeof CitationTagsComponent
  }
}
