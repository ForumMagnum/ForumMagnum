import React from 'react';
import { registerComponent, Components, useStyles } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import Geosuggest from 'react-geosuggest';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
  geoSuggest: {
    display: "inline-block",
    ...geoSuggestStyles(theme),
  },
});

type HasGoogleLocation = {googleLocation: any};

export function FormLocation<T extends HasGoogleLocation, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string>,
  label: string,
}) {
  const classes = useStyles(styles, "FormLocation");
  const {value,setValue} = useFormComponentContext<string,T>(form, fieldName);
  const {value: googleLocationValue, setValue: setGoogleLocationValue} = useFormComponentContext<any,T>(form, "googleLocation");
  const [mapsLoaded] = useGoogleMaps("LocationFormComponent")
  const {Loading} = Components;
  
  const handleSuggestSelect = (suggestion) => {
    if (suggestion?.gmaps) {
      setValue(suggestion.label);
      setGoogleLocationValue(suggestion.gmaps);
    }
  }
  
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>
      {label}
    </span>
    <span className={classes.rightColumn}>
      {mapsLoaded
        ? <Geosuggest
            className={classes.geoSuggest}
            placeholder="Location"
            onSuggestSelect={handleSuggestSelect}
            initialValue={value}
          />
        : <Loading/>
      }
    </span>
  </div>
}

registerComponent('FormLocation', FormLocation, {styles});
declare global {
  interface ComponentTypes {
    FormLocation: typeof FormLocation
  }
}


