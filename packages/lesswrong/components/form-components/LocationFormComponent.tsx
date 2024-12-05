import React, { useState, useEffect, useRef, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Geosuggest from 'react-geosuggest'
// These imports need to be separate to satisfy eslint, for some reason
import type { Suggest, QueryType } from 'react-geosuggest';
import { isClient } from '../../lib/executionEnvironment';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { styles as greyInputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import FormLabel from '@material-ui/core/FormLabel';
import classNames from 'classnames';

// Recommended styling for React-geosuggest: https://github.com/ubilabs/react-geosuggest/blob/master/src/geosuggest.css
export const geoSuggestStyles = (theme: ThemeType) => ({
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
  },
  sectionTitle: {
    fontSize: 12,
  },
  greyRoot: {
    "& .geosuggest__input": {
      ...greyInputStyles(theme).root,
      padding: "16px !important",
      "&:focus": {
        border: "none",
      },
    },
  },
});

export const mapsAPIKeySetting = new DatabasePublicSetting<string | null>('googleMaps.apiKey', null)

let mapsLoadingState: "unloaded"|"loading"|"loaded" = "unloaded";
let onMapsLoaded: Array<() => void> = [];

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
        tag.async = true;
        tag.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKeySetting.get()}&libraries=places&loading=async&callback=googleMapsFinishedLoading`;
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
const LocationPicker = ({
  document,
  path,
  label,
  value,
  updateCurrentValues,
  stringVersionFieldName,
  variant = "default",
  classes,
  locationTypes,
}: Pick<FormComponentProps<AnyBecauseTodo>, "document" | "path" | "label" | "value" | "updateCurrentValues"> & {
  stringVersionFieldName?: string|null,
  variant?: "default" | "grey",
  locationTypes?: QueryType[],
  classes: ClassesType<typeof styles>,
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

  const handleCheckClear = useCallback((value: AnyBecauseTodo) => {
    // clear location fields if the user deletes the input text
    if (value === '') {
      void updateCurrentValues({
        ...(locationFieldName ? {[locationFieldName]: null} : {}),
        [path]: null,
      })
    }
  }, [updateCurrentValues, locationFieldName, path]);

  const handleSuggestSelect = useCallback((suggestion: Suggest) => {
    if (suggestion && suggestion.gmaps) {
      void updateCurrentValues({
        ...(locationFieldName ? {
          [locationFieldName]: suggestion.label
        } : {}),
        [path]: suggestion.gmaps,
      })
    }
  }, [updateCurrentValues, locationFieldName, path]);

  const {Loading, SectionTitle} = Components;

  if (!document || !mapsLoaded) {
    return <Loading />;
  }

  const isGrey = variant === "grey";
  const labelNode = isGrey
    ? <SectionTitle title={label} noTopMargin titleClassName={classes.sectionTitle} />
    : value && <FormLabel className={classes.label}>{label}</FormLabel>;

  return (
    <div className={classNames(classes.root, isGrey && classes.greyRoot)}>
      {label && labelNode}
      <Geosuggest
        ref={geosuggestEl}
        placeholder={label}
        onChange={handleCheckClear}
        onSuggestSelect={handleSuggestSelect}
        initialValue={location}
        types={locationTypes}
      />
    </div>
  );
}

const LocationFormComponent = (props: FormComponentProps<AnyBecauseTodo> & {
  stringVersionFieldName?: string|null,
  variant?: "default" | "grey",
}) => <Components.LocationPicker {...props}/>

const LocationPickerComponent = registerComponent("LocationPicker", LocationPicker, {styles});
const LocationFormComponentComponent = registerComponent("LocationFormComponent", LocationFormComponent, {styles});

declare global {
  interface ComponentTypes {
    LocationPicker: typeof LocationPickerComponent
    LocationFormComponent: typeof LocationFormComponentComponent
  }
}
