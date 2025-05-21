import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { Link } from "@/lib/reactRouterWrapper";
import { getUserProfileLink } from "./wrappedHelpers";
import { useForumWrappedContext } from "./hooks";
import UsersProfileImage from "../../users/UsersProfileImage";
import WrappedSection from "./WrappedSection";
import WrappedHeading from "./WrappedHeading";

const styles = (theme: ThemeType) => ({
  authors: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: 300,
    textAlign: "left",
    margin: "30px auto 0",
  },
  author: {
    display: "flex",
    gap: "16px",
    background: theme.palette.wrapped.panelBackground,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: "20px",
    borderRadius: theme.borderRadius.default,
    padding: "8px 16px",
  },
  authorName: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: "20px",
    margin: 0,
  },
  authorReadCount: {
    margin: 0,
  },
});

const WrappedMostReadAuthorSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data: {mostReadAuthors, postsReadCount}} = useForumWrappedContext();
  return (
    <WrappedSection pageSectionContext="mostReadAuthors">
      <WrappedHeading>
        You read <em>{postsReadCount}</em> post{postsReadCount === 1 ? '' : 's'} this year
      </WrappedHeading>
      {mostReadAuthors[0]?.displayName &&
        <div>
          Your most read author was {mostReadAuthors[0].displayName}
        </div>
      }
      <div className={classes.authors}>
        {mostReadAuthors.map((author) => {
          return <article key={author.slug} className={classes.author}>
            <UsersProfileImage size={40} user={author} />
            <div>
              <h3 className={classes.authorName}>
                <Link to={getUserProfileLink(author.slug, year)} target="_blank">
                  {author.displayName}
                </Link>
              </h3>
              <p className={classes.authorReadCount}>
                {author.count} post{author.count === 1 ? "" : "s"} read
              </p>
            </div>
          </article>
        })}
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedMostReadAuthorSection",
  WrappedMostReadAuthorSection,
  {styles},
);


