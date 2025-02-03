import React, { useState, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import Input from '@material-ui/core/Input';
import { useLazyQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { WebsiteData } from './ThinkSideColumn';
import { useNavigate } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const extractImportantText = (html: string) => {
  return html;
}

export const ThinkOmnibar = ({classes, setActive}: {
  classes: ClassesType<typeof styles>,
  setActive: (active: boolean) => void,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const [value, setValue] = useState('');

  const navigate = useNavigate();

  // Import useLazyQuery from Apollo Client
  const [fetchWebsiteHtmlQuery, { data, loading, error }] = useLazyQuery(gql`
    query FetchWebsiteHtml($url: String!) {
      fetchWebsiteHtml(url: $url)
    }
  `);

  // Handle Enter key press
  const handleKeyPress = async(event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      fetchWebsiteHtmlQuery({ variables: { url: value } });
    }
  };

  // Redirect to the think post page when data is received
  useEffect(() => {
    if (data) {
      const { postId, postSlug } = data.fetchWebsiteHtml;

      if (postId && postSlug) {
        navigate(`/think/posts/${postId}/${postSlug}`);
      } else {
        throw new Error('Post ID or slug not found in data:', data.fetchWebsiteHtml);
      }
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [data, error, navigate]);

  const handleSetActive = (active: boolean) => {
    if (value.length > 0) {
      setActive(true);
    } else {
      setActive(active);
    }
  }

  return <div className={classes.root}>
    <Input
      onFocus={() => handleSetActive(true)}
      onBlur={() => handleSetActive(false)}
      className={classes.root}
      placeholder="Search..."
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
      onKeyPress={handleKeyPress}
      disableUnderline
    />
    {loading && <div>Loading...</div>}
  </div>;
}

const ThinkOmnibarComponent = registerComponent('ThinkOmnibar', ThinkOmnibar, {styles});

declare global {
  interface ComponentTypes {
    ThinkOmnibar: typeof ThinkOmnibarComponent
  }
}
