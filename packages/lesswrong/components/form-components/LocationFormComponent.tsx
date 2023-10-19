import React, { useState, useEffect, useRef } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Geosuggest, {QueryType} from 'react-geosuggest'
// These imports need to be separate to satisfy eslint, for some reason
import type { Suggest } from 'react-geosuggest';
import { isClient } from '../../lib/executionEnvironment';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import FormLabel from '@material-ui/core/FormLabel';

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
    borderBottom: `1px solid ${theme.palette.text.normal}`,
    padding: ".5em .5em 0.5em 0em !important",
    width: 350,
    fontSize: 13,
    color: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
  },
  "& .geosuggest__input:focus": {
    outline: "none",
    borderBottom: `2px solid ${theme.palette.text.normal}`,
    borderBottomColor: theme.palette.geosuggest.dropdownActiveBackground,
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
    color: theme.palette.geosuggest.dropdownText,
    background: theme.palette.geosuggest.dropdownBackground,
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
    background: theme.palette.geosuggest.dropdownHoveredBackground,
  },
  "& .geosuggest__item--active": {
    background: theme.palette.geosuggest.dropdownActiveBackground,
    color: theme.palette.geosuggest.dropdownActiveText,
  },
  "& .geosuggest__item--active:hover, & .geosuggest__item--active:focus": {
    background: theme.palette.geosuggest.dropdownActiveHoveredBackground,
  },
  "& .geosuggest__item__matched-text": {
    fontWeight: "bold",
  }
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...geoSuggestStyles(theme),
    ...theme.typography.commentStyle
  },
  label: {
    fontSize: 10
  }
});

export const mapsAPIKeySetting = new DatabasePublicSetting<string | null>('googleMaps.apiKey', null)

let mapsLoadingState: "unloaded"|"loading"|"loaded" = "unloaded";
let onMapsLoaded: Array<()=>void> = [];

export const useGoogleMaps = (): [boolean, any] => {
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  
  useEffect(() => {
    if (isClient) {
      if (mapsLoadingState === "loaded") {
        setIsMapsLoaded(true);
      } else {
        onMapsLoaded.push(() => {
          setIsMapsLoaded(true);
        });
      }
      
      if (mapsLoadingState === "unloaded") {
        mapsLoadingState = "loading";
        
        var tag = document.createElement('script');
        tag.async = false;
        tag.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKeySetting.get()}&libraries=places&callback=googleMapsFinishedLoading`;
        window.googleMapsFinishedLoading = () => {
          mapsLoadingState = "loaded";
          let callbacks = onMapsLoaded;
          onMapsLoaded = [];
          for (let callback of callbacks) {
            callback();
          }
        }
        document.body.appendChild(tag);
      }
    }
  }, []);
  
  if (!isMapsLoaded) return [false, null];
  return [true, window?.google?.maps];
}


/**
 * LocationPicker: A textbox for typing in a location. This is split from LocationFormComponent
 * so that it can be used outside of vulcan-forms.
 */
const LocationPicker = ({document, path, label, value, updateCurrentValues, stringVersionFieldName, locationTypes, classes}: {
  document: any,
  path: string,
  label?: string,
  value: any,
  updateCurrentValues: any,
  stringVersionFieldName?: string|null,
  locationTypes?: QueryType[]
  classes: ClassesType,
}) => {
  // if this location field has a matching field that just stores the string version of the location,
  // make sure to update the matching field along with this one
  const locationFieldName: string|null = stringVersionFieldName || null;

  const location =
    (locationFieldName && document?.[locationFieldName])
    || document?.[path]?.formatted_address
    || ""
  const [ mapsLoaded ] = useGoogleMaps()
  const geosuggestEl = useRef<any>(null)
  
  useEffect(() => {
    if (geosuggestEl && geosuggestEl.current) {
      geosuggestEl.current.update(value?.formatted_address)
    }
  }, [value])
  
  const handleCheckClear = (value: any) => {
    // clear location fields if the user deletes the input text
    if (value === '') {
      updateCurrentValues({
        ...(locationFieldName ? {[locationFieldName]: null} : {}),
        [path]: null,
      })
    }
  }

  const handleSuggestSelect = (suggestion: Suggest) => {
    if (suggestion && suggestion.gmaps) {
      updateCurrentValues({
        ...(locationFieldName ? {
          [locationFieldName]: suggestion.label
        } : {}),
        [path]: suggestion.gmaps,
      })
    }
  }


  if (document && mapsLoaded) {
    return <div className={classes.root}>
      {value && label && <FormLabel className={classes.label}>{label}</FormLabel>}
      <Geosuggest
        ref={geosuggestEl}
        placeholder={label}
        onChange={handleCheckClear}
        onSuggestSelect={handleSuggestSelect}
        initialValue={location}
        types={locationTypes}
      />
    </div>
  } else {
    return <Components.Loading/>;
  }
}

const LocationFormComponent = (props: FormComponentProps<any> & {
  stringVersionFieldName?: string|null,
}) => {
  return <Components.LocationPicker {...props}/>
}

const LocationPickerComponent = registerComponent("LocationPicker", LocationPicker, {styles});
const LocationFormComponentComponent = registerComponent("LocationFormComponent", LocationFormComponent, {styles});

declare global {
  interface ComponentTypes {
    LocationPicker: typeof LocationPickerComponent
    LocationFormComponent: typeof LocationFormComponentComponent
  }
}
