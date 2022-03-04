import React, { useState, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Geosuggest from 'react-geosuggest';
import { isClient } from '../../lib/executionEnvironment';
import { DatabasePublicSetting } from '../../lib/publicSettings';

// Recommended styling for React-geosuggest: https://github.com/ubilabs/react-geosuggest/blob/master/src/geosuggest.css
export const geoSuggestStyles = (theme: ThemeType): JssStyles => ({
  "& .geosuggest": {
    fontSize: "1rem",
    position: "relative",
    paddingRight: 3,
    width: "100%",
    textAlign: "left",
  },
  
  "& .geosuggest__input": {
    backgroundColor: 'transparent',
    border: "2px solid transparent",
    borderBottom: "1px solid rgba(0,0,0,.87)",
    padding: ".5em .5em 0.5em 0em !important",
    width: 350,
    fontSize: 13,
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
  },
  "& .geosuggest__input:focus": {
    outline: "none",
    borderBottom: "2px solid rgba(0,0,0,.87)",
    borderBottomColor: "#267dc0",
    boxShadow: "0 0 0 transparent",
  },
  
  "& .geosuggest__suggests": {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "25em",
    padding: 0,
    marginTop: -1,
    background: "#fff",
    borderTopWidth: 0,
    overflowX: "hidden",
    overflowY: "auto",
    listStyle: "none",
    zIndex: 5,
    transition: "max-height 0.2s, border 0.2s",
  },
  "& .geosuggest__suggests--hidden": {
    maxHeight: 0,
    overflow: "hidden",
    borderWidth: 0,
  },
  
  "& .geosuggest__item": {
    fontSize: "1rem",
    padding: ".5em .65em",
    cursor: "pointer",
  },
  "& .geosuggest__item:hover, & .geosuggest__item:focus": {
    background: "#f5f5f5",
  },
  "& .geosuggest__item--active": {
    background: "#267dc0",
    color: "#fff",
  },
  "& .geosuggest__item--active:hover, & .geosuggest__item--active:focus": {
    background: "#ccc",
  },
  "& .geosuggest__item__matched-text": {
    fontWeight: "bold",
  }
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...geoSuggestStyles(theme)
  }
});

export const mapsAPIKeySetting = new DatabasePublicSetting<string | null>('googleMaps.apiKey', null)

export const useGoogleMaps = (identifier, libraries = ['places']) => {
  const [ mapsLoaded, setMapsLoaded ] = useState((typeof window !== 'undefined') ? (window as any).google : null)
  const callbackName = `${identifier}_googleMapsLoaded`
  useEffect(() => {
    if (isClient) {
      window[callbackName] = () => setMapsLoaded(true)
    }
  })
  const tagId = `${identifier}_googleMapsScriptTag`
  if (isClient) {
    if (!document.getElementById(tagId)) {
      var tag = document.createElement('script');
      tag.async = false;
      tag.id = tagId
      tag.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKeySetting.get()}&libraries=${libraries}&callback=${callbackName}`;
      document.body.appendChild(tag);
    }
  }
  if (!mapsLoaded) return [ mapsLoaded ]
  else return [ mapsLoaded, (window as any)?.google?.maps ]
}



const LocationFormComponent = ({document, updateCurrentValues, classes}: {
  document: any,
  updateCurrentValues: any,
  classes: ClassesType,
}) => {
  const location = document?.location || ""
  const [ mapsLoaded ] = useGoogleMaps("CommunityHome")
  useEffect(() => {
    updateCurrentValues({
      location: (document && document.location) || "",
      googleLocation: document && document.googleLocation,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const handleCheckClear = (value) => {
    // clear location fields if the user deletes the input text
    if (value === '') {
      updateCurrentValues({
        location: null,
        googleLocation: null,
      })
    }
  }

  const handleSuggestSelect = (suggestion) => {
    if (suggestion && suggestion.gmaps) {
      updateCurrentValues({
        location: suggestion.label,
        googleLocation: suggestion.gmaps,
      })
    }
  }


  if (document && mapsLoaded) {
    return <div className={classes.root}>
      <Geosuggest
        placeholder="Location"
        onChange={handleCheckClear}
        onSuggestSelect={handleSuggestSelect}
        initialValue={location}
      />
    </div>
  } else {
    return null
  }
}

// TODO: This is not using the field name provided by the form. It definitely
// doesn't work in nested contexts, and might be making a lie out of our schema.
const LocationFormComponentComponent = registerComponent("LocationFormComponent", LocationFormComponent, {styles});

declare global {
  interface ComponentTypes {
    LocationFormComponent: typeof LocationFormComponentComponent
  }
}
