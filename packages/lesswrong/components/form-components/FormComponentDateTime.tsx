import React, { useCallback, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import DatePicker from "react-datepicker";
import moment from '../../lib/moment-timezone';
import InputLabel from '@/lib/vendor/@material-ui/core/src/InputLabel';
import FormControl from '@/lib/vendor/@material-ui/core/src/FormControl';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { darken, lighten } from '@/lib/vendor/@material-ui/core/src/styles/colorManipulator';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { ClearInput } from './ClearInput';

const styles = defineStyles("DatePicker", (theme: ThemeType) => {
  const datepicker__backgroundColor = theme.palette.grey[140];
  const datepicker__borderColor = theme.palette.invertIfDarkMode("#aeaeae");
  const datepicker__highlightedColor = theme.palette.invertIfDarkMode("#3dcc4a");
  const datepicker__holidaysColor = theme.palette.invertIfDarkMode("#ff6803");
  const datepicker__mutedColor = theme.palette.invertIfDarkMode("#ccc");
  const datepicker__selectedColor = theme.palette.invertIfDarkMode("#216ba5");
  const datepicker__selectedColorDisabled = theme.themeOptions.name === 'dark'
    ? "rgba(222, 148, 90, .5)"
    : "rgba(33, 107, 165, .5)";
  const datepicker__textColor = theme.palette.text.maxIntensity;
  const datepicker__headerColor = theme.palette.greyAlpha(1.0);
  const datepicker__navigationDisabledColor = lighten(datepicker__mutedColor, .1);
  const datepicker__border = `1px solid ${datepicker__borderColor};`;
  const datepicker__borderRadius = "0.3rem";
  const datepicker__dayMargin = "0.166rem";
  const datepicker__fontSize = "0.8rem";
  const datepicker__fontFamily = "\"Helvetica Neue\", helvetica, arial, sans-serif";
  const datepicker__itemSize = "1.7rem";
  const datepicker__margin = "0.4rem";
  const datepicker__navigationButtonSize = "32px";

  const navigationChevron = {
    borderColor: datepicker__mutedColor,
    borderStyle: "solid",
    borderWidth: "3px 3px 0 0",
    content: '""',
    display: "block",
    height: 9,
    position: "absolute",
    top: 6,
    width: 9,
  
    "&--disabled, &--disabled:hover": {
      borderColor: datepicker__navigationDisabledColor,
      cursor: "default",
    }
  }

  return {
    input: {
      borderBottom: `solid 1px ${theme.palette.grey[550]}`,
      padding: '6px 0 7px 0',
      background: 'transparent'
    },
    error: {
      borderBottom: `solid 1px ${theme.palette.error.main}`,
    },
    label: {
      position:"relative",
      transform:"none",
      fontSize: 10,
    },
    timezone: {
      marginLeft: 4
    },
  
    wrapperAbove: {
      "& .rdtPicker": {
        bottom: 30,
      },
    },
    wrapperBelow: {
      "& .rdtOpen .DatePicker-input": {
        borderBottom: `solid 1px ${theme.palette.grey[550]}`,
      },
    },
  
    // Styles from react-datepicker (https://github.com/Hacker0x01/react-datepicker/blob/main/docs/datepicker.md)
    wrapper: {
      "& .react-datepicker-wrapper": {
        display: "inline-block",
        padding: 0,
        border: 0,
      },
      
      "& .react-datepicker": {
        fontFamily: datepicker__fontFamily,
        fontSize: datepicker__fontSize,
        backgroundColor: theme.palette.panelBackground.default,
        color: datepicker__textColor,
        border: datepicker__border,
        borderRadius: datepicker__borderRadius,
        display: "inline-block",
        position: "relative",
      
        // Reverting value set in .react-datepicker-popper
        lineHeight: "initial",
      },
      
      "& .react-datepicker--time-only": {
        "& .react-datepicker__time-container": {
          borderLeft: 0,
        },
      
        "& .react-datepicker__time, & .react-datepicker__time-box": {
          borderBottomLeftRadius: "0.3rem",
          borderBottomRightRadius: "0.3rem",
        }
      },
      
      "& .react-datepicker-popper": {
        zIndex: 1,
      
        // Eliminating extra space at the bottom of the container
        lineHeight: 0,
      
        "& .react-datepicker__triangle": {
          stroke: datepicker__borderColor,
        },
      
        '&[data-placement^="bottom"]': {
          "& .react-datepicker__triangle": {
            fill: datepicker__backgroundColor,
            color: datepicker__backgroundColor,
          }
        },
      
        '&[data-placement^="top"]': {
          "& .react-datepicker__triangle": {
            fill: theme.palette.icon.maxIntensity,
            color: theme.palette.icon.maxIntensity,
          }
        }
      },
      
      "& .react-datepicker__header": {
        textAlign: "center",
        backgroundColor: datepicker__backgroundColor,
        borderBottom: datepicker__border,
        borderTopLeftRadius: datepicker__borderRadius,
        padding: "8px 0",
        position: "relative",
      
        "&--time": {
          paddingBottom: 8,
          paddingLeft: 5,
          paddingRight: 5,
      
          "&:not(&--only)": {
            borderTopLeftRadius: 0,
          }
        },
      
        "&:not(&--has-time-select)": {
          borderTopRightRadius: datepicker__borderRadius,
        }
      },
      
      "& .react-datepicker__year-dropdown-container--select, & .react-datepicker__month-dropdown-container--select, & .react-datepicker__month-year-dropdown-container--select, & .react-datepicker__year-dropdown-container--scroll, & .react-datepicker__month-dropdown-container--scroll, & .react-datepicker__month-year-dropdown-container--scroll": {
        display: "inline-block",
        margin: "0 15px",
      },
      
      "& .react-datepicker__current-month, & .react-datepicker-time__header, & .react-datepicker-year-header": {
        marginTop: 0,
        color: datepicker__headerColor,
        fontWeight: "bold",
        fontSize: "0.944rem"
      },
      
      "& h2.react-datepicker__current-month": {
        padding: 0,
        margin: 0,
      },
      
      "& .react-datepicker-time__header": {
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
      },
      
      "& .react-datepicker__navigation": {
        alignItems: "center",
        background: "none",
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
        position: "absolute",
        top: 2,
        padding: 0,
        border: "none",
        zIndex: 1,
        height: datepicker__navigationButtonSize,
        width: datepicker__navigationButtonSize,
        textIndent: "-999em",
        overflow: "hidden",
      
        "&--previous": {
          left: 2,
        },
      
        "&--next": {
          right: 2,
      
          "&--with-time:not(&--with-today-button)": {
            right: 85,
          }
        },
      
        "&--years": {
          position: "relative",
          top: 0,
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
      
          "&-previous": {
            top: 4,
          },
      
          "&-upcoming": {
            top: -4,
          },
        },
      
        "&:hover": {
          "*::before": {
            borderColor: darken(datepicker__mutedColor, .15),
          }
        }
      },
      
      "& .react-datepicker__navigation-icon": {
        position: "relative",
        top: -1,
        fontSize: 20,
        width: 0,
      
        "&::before": {
          ...navigationChevron,
        },
      
        "&--next": {
          left: -2,
      
          "&::before": {
            transform: "rotate(45deg)",
            left: -7,
          }
        },
      
        "&--previous": {
          right: -2,
      
          "&::before": {
            transform: "rotate(225deg)",
            right: -7,
          }
        }
      },
      
      "& .react-datepicker__month-container": {
        float: "left",
      },
      
      "& .react-datepicker__year": {
        margin: datepicker__margin,
        textAlign: "center",
      
        "&-wrapper": {
          display: "flex",
          flexWrap: "wrap",
          maxWidth: 180,
        },
      
        "& .react-datepicker__year-text": {
          display: "inline-block",
          width: "4rem",
          margin: 2,
        }
      },
      
      "& .react-datepicker__month": {
        margin: datepicker__margin,
        textAlign: "center",
      
        "& .react-datepicker__month-text, & .react-datepicker__quarter-text": {
          display: "inline-block",
          width: "4rem",
          margin: 2,
        }
      },
      
      "& .react-datepicker__input-time-container": {
        clear: "both",
        width: "100%",
        float: "left",
        margin: "5px 0 10px 15px",
        textAlign: "left",
      
        "& .react-datepicker-time__caption": {
          display: "inline-block",
        },
      
        "& .react-datepicker-time__input-container": {
          display: "inline-block",
      
          "& .react-datepicker-time__input": {
            display: "inline-block",
            marginLeft: "10px",
      
            "& input": {
              width: "auto",
            },
      
            "& input[type='time']::-webkit-inner-spin-button, & input[type='time']::-webkit-outer-spin-button": {
              "-webkit-appearance": "none",
              margin: 0,
            },
      
            "& input[type='time']": {
              "-moz-appearance": "textfield",
            }
          },
      
          "& .react-datepicker-time__delimiter": {
            marginLeft: 5,
            display: "inline-block",
          }
        }
      },
      
      "& .react-datepicker__time-container": {
        float: "right",
        borderLeft: datepicker__border,
        width: 85,
      
        "&--with-today-button": {
          display: "inline",
          border: datepicker__border,
          borderRadius: "0.3rem",
          position: "absolute",
          right: -87,
          top: 0,
        },
      
        "& .react-datepicker__time": {
          position: "relative",
          background: theme.palette.panelBackground.default,
          borderBottomRightRadius: "0.3rem",
      
          "& .react-datepicker__time-box": {
            width: 85,
            overflowX: "hidden",
            margin: "0 auto",
            textAlign: "center",
            borderBottomRightRadius: "0.3rem",
      
            "& .react-datepicker__time-list": {
              listStyle: "none",
              margin: 0,
              height: "calc(195px + 0.85rem)",
              overflowY: "scroll",
              paddingRight: 0,
              paddingLeft: 0,
              width: "100%",
              boxSizing: "content-box",
      
              "& .react-datepicker__time-list-item": {
                height: 30,
                padding: "5px 10px",
                whiteSpace: "nowrap",
      
                "&:hover": {
                  cursor: "pointer",
                  backgroundColor: datepicker__backgroundColor,
                },
      
                "&--selected": {
                  backgroundColor: datepicker__selectedColor,
                  color: theme.palette.text.invertedBackgroundText,
                  fontWeight: "bold",
      
                  "&:hover": {
                    backgroundColor: datepicker__selectedColor,
                  }
                },
      
                "&--disabled": {
                  color: datepicker__mutedColor,
      
                  "&:hover": {
                    cursor: "default",
                    backgroundColor: "transparent",
                  }
                }
              }
            }
          }
        }
      },
      
      "& .react-datepicker__week-number": {
        color: datepicker__mutedColor,
        display: "inline-block",
        width: datepicker__itemSize,
        lineHeight: datepicker__itemSize,
        textAlign: "center",
        margin: datepicker__dayMargin,
      
        "&.react-datepicker__week-number--clickable": {
          cursor: "pointer",
      
          "&:not(&--selected):hover": {
            borderRadius: datepicker__borderRadius,
            backgroundColor: datepicker__backgroundColor,
          }
        },
      
        "&--selected": {
          borderRadius: datepicker__borderRadius,
          backgroundColor: datepicker__selectedColor,
          color: theme.palette.text.invertedBackgroundText,
      
          "&:hover": {
            backgroundColor: "color.adjust(datepicker__selectedColor, -5%)",
          }
        }
      },
      
      "& .react-datepicker__day-names": {
        whiteSpace: "nowrap",
        marginBottom: "-8px",
      },
      
      "& .react-datepicker__week": {
        whiteSpace: "nowrap",
      },
      
      "& .react-datepicker__day-name, & .react-datepicker__day, & .react-datepicker__time-name": {
        color: datepicker__textColor,
        display: "inline-block",
        width: datepicker__itemSize,
        lineHeight: datepicker__itemSize,
        textAlign: "center",
        margin: datepicker__dayMargin,
      },
      
      "& .react-datepicker__day, & .react-datepicker__month-text, & .react-datepicker__quarter-text, & .react-datepicker__year-text": {
        cursor: "pointer",
      
        "&:not([aria-disabled='true']):hover": {
          borderRadius: datepicker__borderRadius,
          backgroundColor: datepicker__backgroundColor,
        },
      
        "&--today": {
          fontWeight: "bold",
        },
      
        "&--highlighted": {
          borderRadius: datepicker__borderRadius,
          backgroundColor: datepicker__highlightedColor,
          color: theme.palette.text.invertedBackgroundText,
      
          '&:not([aria-disabled="true"]):hover': {
            backgroundColor: darken(datepicker__highlightedColor, .05),
          },
      
          "&--custom-1": {
            color: "magenta",
          },
      
          "&--custom-2": {
            color: "green",
          },
        },
      
        "&--holidays": {
          position: "relative",
          borderRadius: datepicker__borderRadius,
          backgroundColor: datepicker__holidaysColor,
          color: theme.palette.text.invertedBackgroundText,
      
          "& .overlay": {
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: theme.palette.grey.A400,
            color: theme.palette.text.maxIntensity,
            padding: 4,
            borderRadius: 4,
            whiteSpace: "nowrap",
            visibility: "hidden",
            opacity: 0,
            transition: "visibility 0s, opacity 0.3s ease-in-out",
          },
      
          "&:not([aria-disabled='true']):hover": {
            backgroundColor: darken(datepicker__holidaysColor, .1),
          },
      
          "&:hover .overlay": {
            visibility: "visible",
            opacity: 1,
          }
        },
      
        "&--selected, &--in-selecting-range, &--in-range": {
          borderRadius: datepicker__borderRadius,
          backgroundColor: datepicker__selectedColor,
          color: theme.palette.text.invertedBackgroundText,
      
          '&:not([aria-disabled="true"]):hover': {
            backgroundColor: darken(datepicker__selectedColor, .05),
          }
        },
      
        "&--keyboard-selected": {
          borderRadius: datepicker__borderRadius,
          backgroundColor: lighten(datepicker__selectedColor, .45),
          color: theme.palette.text.maxIntensity,
      
          '&:not([aria-disabled="true"]):hover': {
            backgroundColor: darken(datepicker__selectedColor, .05),
          }
        },
      
        "&--in-selecting-range:not(&--in-range)": {
          backgroundColor: datepicker__selectedColorDisabled,
        },
      
        "&--in-range:not(&--in-selecting-range)": {
          "& .react-datepicker__month--selecting-range &, & .react-datepicker__year--selecting-range &": {
            backgroundColor: datepicker__backgroundColor,
            color: datepicker__textColor,
          }
        },
      
        "&--disabled": {
          cursor: "default",
          color: datepicker__mutedColor,
      
          "& .overlay": {
            position: "absolute",
            bottom: "70%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: theme.palette.grey["A400"],
            color: theme.palette.text.maxIntensity,
            padding: 4,
            borderRadius: 4,
            whiteSpace: "nowrap",
            visibility: "hidden",
            opacity: 0,
            transition: "visibility 0s, opacity 0.3s ease-in-out",
          }
        }
      },
      
      "& .react-datepicker__input-container": {
        position: "relative",
        display: "inline-block",
        width: "100%",
      
        "& .react-datepicker__calendar-icon": {
          position: "absolute",
          padding: "0.5rem",
          boxSizing: "content-box",
        }
      },
      
      "& .react-datepicker__view-calendar-icon": {
        "& input": {
          padding: "6px 10px 5px 25px",
        }
      },
      
      "& .react-datepicker__year-read-view, &.react-datepicker__month-read-view, & .react-datepicker__month-year-read-view": {
        border: "1px solid transparent",
        borderRadius: datepicker__borderRadius,
        position: "relative",
      
        "&:hover": {
          cursor: "pointer",
      
          "& .react-datepicker__year-read-view--down-arrow, & .react-datepicker__month-read-view--down-arrow": {
            borderTopColor: darken(datepicker__mutedColor, .1),
          }
        },
      
        "&--down-arrow": {
          ...navigationChevron,
          transform: "rotate(135deg)",
          right: "-16px",
          top: 0,
        }
      },
      
      "& .react-datepicker__year-dropdown, & .react-datepicker__month-dropdown, & .react-datepicker__month-year-dropdown": {
        backgroundColor: datepicker__backgroundColor,
        position: "absolute",
        width: "50%",
        left: "25%",
        top: "30px",
        zIndex: 1,
        textAlign: "center",
        borderRadius: datepicker__borderRadius,
        border: datepicker__border,
      
        "&:hover": {
          cursor: "pointer",
        },
      
        "&--scrollable": {
          height: "150px",
          overflowY: "scroll",
        }
      },
      
      "& .react-datepicker__year-option, &.react-datepicker__month-option, & .react-datepicker__month-year-option": {
        lineHeight: "20px",
        width: "100%",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
      
        "&:first-of-type": {
          borderTopLeftRadius: datepicker__borderRadius,
          borderTopRightRadius: datepicker__borderRadius,
        },
      
        "&:last-of-type": {
          "-webkit-user-select": "none",
          "-moz-user-select": "none",
          "-ms-user-select": "none",
          "user-select": "none",
          borderBottomLeftRadius: datepicker__borderRadius,
          borderBottomRightRadius: datepicker__borderRadius,
        },
      
        "&:hover": {
          backgroundColor: datepicker__mutedColor,
      
          "& .react-datepicker__navigation--years-upcoming": {
            borderBottomColor: darken(datepicker__mutedColor, .1),
          },
      
          "& .react-datepicker__navigation--years-previous": {
            borderTopColor: darken(datepicker__mutedColor, .1),
          }
        },
      
        "&--selected": {
          position: "absolute",
          left: "15px",
        },
      },
      
      "& .react-datepicker__close-icon": {
        cursor: "pointer",
        backgroundColor: "transparent",
        border: 0,
        outline: 0,
        padding: "0 6px 0 0",
        position: "absolute",
        top: 0,
        right: 0,
        height: "100%",
        display: "table-cell",
        verticalAlign: "middle",
      
        "&::after": {
          cursor: "pointer",
          backgroundColor: datepicker__selectedColor,
          color: theme.palette.text.maxIntensity,
          borderRadius: "50%",
          height: "16px",
          width: "16px",
          padding: "2px",
          fontSize: "12px",
          lineHeight: 1,
          textAlign: "center",
          display: "table-cell",
          verticalAlign: "middle",
          content: '"\u00d7"',
        },
      
        "&--disabled": {
          cursor: "default",
      
          "&::after": {
            cursor: "default",
            backgroundColor: datepicker__mutedColor,
          }
        }
      },
      
      "& .react-datepicker__today-button": {
        background: datepicker__backgroundColor,
        borderTop: datepicker__border,
        cursor: "pointer",
        textAlign: "center",
        fontWeight: "bold",
        padding: "5px 0",
        clear: "left",
      },
      
      "& .react-datepicker__portal": {
        position: "fixed",
        width: "100vw",
        height: "100vh",
        backgroundColor: theme.palette.greyAlpha(0.8),
        left: 0,
        top: 0,
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        zIndex: 2147483647,
      
        "& .react-datepicker__day-name, & .react-datepicker__day, & .react-datepicker__time-name": {
          width: "3rem",
          lineHeight: "3rem",
        },
      
        "@media (max-width: 400px), (max-height: 550px)": {
          "& .react-datepicker__day-name, & .react-datepicker__day, & .react-datepicker__time-name": {
            width: "2rem",
            lineHeight: "2rem",
          }
        },
      
        "& .react-datepicker__current-month, & .react-datepicker-time__header": {
          fontSize: "1.44rem",
        },
      },
      
      "& .react-datepicker__children-container": {
        width: "13.8rem",
        margin: "0.4rem",
        paddingRight: "0.2rem",
        paddingLeft: "0.2rem",
        height: "auto",
      },
      
      "& .react-datepicker__aria-live": {
        position: "absolute",
        clipPath: "circle(0)",
        border: 0,
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        width: 1,
        whiteSpace: "nowrap",
      },
      
      "& .react-datepicker__calendar-icon": {
        width: "1em",
        height: "1em",
        verticalAlign: "-0.125em",
      },
    },
  };
});

/**
 * A wrapper around the react-datepicker library, making a UI element for picking
 * a date/time. Needs the wrapping to get its styles. This is split from
 * FormComponentDateTime so that it can be used in non-vulcan-forms contexts.
 */
const ReactDatePicker = ({label, name, value, below, onChange}: {
  label?: string,
  name?: string,
  value?: Date,
  below?: boolean,
  onChange: (newValue: Date) => void,
  onClose?: (newValue: Date) => void,
}) => {
  const classes = useStyles(styles);
  // since tz abbrev can depend on the date (i.e. EST vs EDT),
  // we try to use the selected date to determine the tz (and default to now)
  const tzDate = value ? moment(value) : moment();
  const [error, setError] = useState(false)
  const valueIsNullRef = useRef(!value)

  const handleDateChange = useCallback((newDate: Date) => {
    if (newDate) {
      onChange(newDate);
      setError(false)
    } else {
      setError(true)
    }
  }, [onChange]);

  const valueJustCleared = !value && valueIsNullRef.current
  valueIsNullRef.current = !value

  return <FormControl>
    <InputLabel className={classes.label}>
      { label } <span className={classes.timezone}>({tzDate.tz(moment.tz.guess()).zoneAbbr()})</span>
    </InputLabel>
    <div className={classNames(classes.wrapper, {
      [classes.wrapperAbove]: !below,
      [classes.wrapperBelow]: below,
    })}>
      <DatePicker
        showTimeInput
        dateFormat="MM/dd/yyyy h:mm aa"
        selected={value}
        onChange={handleDateChange}
        timeInputLabel="Time:"
      />
    </div>
  </FormControl>
}


export const FormComponentDatePicker = ({ field, label, name, below }: {
  field: TypedFieldApi<Date | null>,
  label: string,
  name?: string,
  below?: boolean,
}) => {
  const value = field.state.value;
  const date = value ? (typeof value === 'string' ? new Date(value) : value) : undefined;

  return (<>
    <ReactDatePicker
      label={label}
      name={name}
      value={date}
      onChange={field.handleChange}
      below={below}
    />
    <ClearInput clearField={() => field.handleChange(null)} />
  </>);
}

const DatePickerComponent = registerComponent("DatePicker", ReactDatePicker);

declare global {
  interface ComponentTypes {
    DatePicker: typeof DatePickerComponent
  }
}

////////////////////////////////////////////////////////////////////////////
