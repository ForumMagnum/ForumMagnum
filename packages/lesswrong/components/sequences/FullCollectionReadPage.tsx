import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    '& h1': {
      fontSize: '3rem',
      marginTop: '3rem',
      fontWeight:600,
      ...theme.typography.postStyle
    },
    '& h2': {
      fontSize: '2.4rem',
      marginTop: '1.5rem',
      fontWeight:500,
      ...theme.typography.postStyle
    },
    '& h3': {
      fontSize: '2.2rem',
      marginTop: '1.5rem',
      fontWeight:500,
      ...theme.typography.postStyle
    },
    '& h1:first-child, h2:first-child, h3:first-child': {
      marginTop: 0,
    },
    '& h4': {
      fontSize: '2rem',
      marginTop: '1.5rem',
      fontWeight:500,
      ...theme.typography.postStyle
    },
  }
});

export const FullCollectionReadPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, ContentStyles, ContentItemBody, SingleColumnSection } = Components;
  const { params } = useLocation();
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { results, loading } = useMulti({
    terms: {view: "collectionBySlug", slug: params?.slug},
    collectionName: "Collections",
    fragmentName: 'CollectionsPageFragment',
  });
  
  return <div className={classes.root}>
      <SingleColumnSection>
        {loading && <Loading />}
        {results && <div>
          <h1>{results[0].title}</h1>
          {results[0].books.map(book => {
            return <div key={book._id}>
              <h1>{book.title}</h1>
              {book.sequences.map(sequence => {
                return <div key={sequence._id}>
                  <h2>{sequence.title}</h2>
                  {sequence.chapters.map(chapter => {
                    return <div key={chapter._id}>
                      <h3>{chapter.title}</h3>
                      {chapter.posts.map(post => {
                        return <div key={post._id}>
                          <h4>{post.title}</h4>
                          <ContentStyles contentType="post">
                            <ContentItemBody
                              dangerouslySetInnerHTML={{__html: post.contents?.htmlHighlight || ""}}
                            />
                          </ContentStyles>
                        </div>
                      })}
                    </div>
                  })}
                </div>
              })}
            </div>
          })}
        </div>}
      </SingleColumnSection>;
    </div>
}

const FullCollectionReadPageComponent = registerComponent('FullCollectionReadPage', FullCollectionReadPage, {styles});

declare global {
  interface ComponentTypes {
    FullCollectionReadPage: typeof FullCollectionReadPageComponent
  }
}

