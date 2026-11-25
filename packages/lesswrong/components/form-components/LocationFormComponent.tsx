import { useForumType } from '@/components/hooks/useForumType';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Geosuggest from 'react-geosuggest'
// These imports need to be separate to satisfy eslint, for some reason
import type { GeosuggestProps, Suggest, QueryType } from 'react-geosuggest';
import { isClient } from '../../lib/executionEnvironment';
import { mapsAPIKey } from '@/lib/instanceSettings';
import { rootStyles as greyInputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import TextField from '@/lib/vendor/@material-ui/core/src/TextField/TextField';
import type { InputBaseComponentProps } from '@/lib/vendor/@material-ui/core/src/InputBase/InputBase';
import classNames from 'classnames';
import type { FieldValueBinding } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { styles as muiTextFieldStyles } from './MuiTextField';
import Loading from "../vulcan-core/Loading";
import SectionTitle from "../common/SectionTitle";

// Recommended styling for React-geosuggest: https://github.com/ubilabs/react-geosuggest/blob/master/src/geosuggest.css
const geoSuggestDropdownStyles = (theme: ThemeType) => ({
  "& .geosuggest": {
    fontSize: "1rem",
    position: "relative",
    paddingRight: 3,
    width: "100%",
    textAlign: "left",
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

export const geoSuggestStyles = (theme: ThemeType) => ({
  ...geoSuggestDropdownStyles(theme),

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
})

const styles = defineStyles('LocationFormComponent', (theme: ThemeType) => ({
  textFieldInput: {
    width: "100%",
    ...geoSuggestDropdownStyles(theme),
  },
  root: {
    ...geoSuggestStyles(theme),
    ...theme.typography.commentStyle
  },
  sectionTitle: {
    fontSize: 12,
  },
  greyRoot: {
    "& .geosuggest__input": {
      ...greyInputStyles(theme),
      padding: "16px !important",
      "&:focus": {
        border: "none",
      },
    },
  },
}));

let mapsLoadingState: "unloaded"|"loading"|"loaded" = "unloaded";
let onMapsLoaded: Array<() => void> = [];

export const useGoogleMaps = (): [boolean, any] => {
  const { forumType } = useForumType();
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
        tag.src = `https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places&loading=async&callback=googleMapsFinishedLoading`;
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
  }, [forumType]);
  
  if (!isMapsLoaded) return [false, null];
  return [true, window?.google?.maps];
}

const GeosuggestInput = ({ className, inputRef, placeholder, onFocus, onBlur, geosuggestProps }: InputBaseComponentProps) => {
  const classes = useStyles(styles);
  const typedGeosuggestProps: GeosuggestProps = geosuggestProps;

  return (
    <div className={classes.textFieldInput} onFocus={onFocus} onBlur={onBlur}>
      <Geosuggest
        ref={inputRef}
        inputClassName={className}
        // Geosuggest substitutes its own default placeholder for undefined
        placeholder={placeholder ?? ""}
        {...typedGeosuggestProps}
      />
    </div>
  );
}

export const LocationFormComponent = ({
  field,
  label,
  stringVersionFieldName = null,
  variant = 'default',
  locationTypes,
}: {
  field: FieldValueBinding<AnyBecauseHard> & {
    form?: { setFieldValue: (name: AnyBecauseHard, value: AnyBecauseHard) => void };
  };
  label: string;
  /** Optional sibling field that stores the plain‑string version of the location */
  stringVersionFieldName?: keyof localGroupsEdit | null;
  variant?: 'default' | 'grey';
  locationTypes?: QueryType[];
}) => {
  const classes = useStyles(styles);
  const textFieldClasses = useStyles(muiTextFieldStyles);
  const [mapsLoaded] = useGoogleMaps();
  const geosuggestEl = useRef<Geosuggest>(null);

  const value = field.state.value as AnyBecauseTodo | null;
  const initialLocation =
    value?.formatted_address ??
    '';

  // Geosuggest owns the text in its input, and only reports it when it
  // changes. Until the first report, the input shows initialLocation.
  const [reportedInputText, setReportedInputText] = useState<string | null>(null);
  const inputText = reportedInputText ?? initialLocation;

  useEffect(() => {
    if (geosuggestEl.current) {
      geosuggestEl.current.update(value?.formatted_address);
    }
  }, [value]);

  const form = field.form;

  const updateSibling = useCallback((val: any) => {
    if (stringVersionFieldName && form?.setFieldValue) {
      form.setFieldValue(stringVersionFieldName, val);
    }
  }, [stringVersionFieldName, form]);

  const handleInputTextChange = useCallback((text: string | undefined) => {
    setReportedInputText(text ?? '');
    if (text === '') {
      updateSibling(null);
      field.handleChange(null);
    }
  }, [field, updateSibling]);

  const handleSuggestSelect = useCallback((suggestion: Suggest) => {
    if (suggestion && suggestion.gmaps) {
      updateSibling(suggestion.label);
      field.handleChange(suggestion.gmaps);
    }
  }, [field, updateSibling]);
  if (!mapsLoaded) return <Loading />;

  const geosuggestProps: GeosuggestProps = {
    onChange: handleInputTextChange,
    onSuggestSelect: handleSuggestSelect,
    initialValue: initialLocation,
    types: locationTypes,
  };

  if (variant === 'grey') {
    return (
      <div className={classNames(classes.root, classes.greyRoot)}>
        {label && <SectionTitle title={label} noTopMargin titleClassName={classes.sectionTitle} />}
        <Geosuggest ref={geosuggestEl} placeholder={label} {...geosuggestProps} />
      </div>
    );
  }

  return (
    <TextField
      className={textFieldClasses.textField}
      label={label}
      value={inputText}
      inputRef={geosuggestEl}
      InputProps={{ inputComponent: GeosuggestInput }}
      inputProps={{ geosuggestProps }}
    />
  );
}
