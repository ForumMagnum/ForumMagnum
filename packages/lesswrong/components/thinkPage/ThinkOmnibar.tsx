import React, { useState, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import Input from '@material-ui/core/Input';
import { useLazyQuery } from '@apollo/client';
import gql from 'graphql-tag';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const extractImportantText = (html: string) => {
  return html;
}

export const ThinkOmnibar = ({classes, setWebsiteUrls, websiteUrls}: {
  classes: ClassesType<typeof styles>,
  setWebsiteUrls: (urls: Record<string, {title: string, body: string}>) => void,
  websiteUrls: Record<string, {title: string, body: string}>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const [value, setValue] = useState('');

  // Import useLazyQuery from Apollo Client
  const [fetchWebsiteHtmlQuery, { data, loading, error }] = useLazyQuery(gql`
    query FetchWebsiteHtml($url: String!) {
      fetchWebsiteHtml(url: $url)
    }
  `);

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      fetchWebsiteHtmlQuery({ variables: { url: value } });
    }
  };

  // Log the fetched HTML when data is received
  useEffect(() => {
    if (data) {
      const { body, title, url, paragraph, bodyLength, paragraphLength } = data.fetchWebsiteHtml;
      console.log(data.fetchWebsiteHtml);
      setWebsiteUrls({...websiteUrls, [url]: {title, body, paragraph, bodyLength, paragraphLength}});
      if (navigator.clipboard && window.isSecureContext) {
        void navigator.clipboard.writeText(body);
      }
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [data, error, setWebsiteUrls, websiteUrls]);

  return <div className={classes.root}>
    <Input
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
