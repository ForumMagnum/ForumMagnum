import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '../../common/withUser';
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS, userGetProfileUrl } from "@/lib/collections/users/helpers";
import ArrowBack from '@/lib/vendor/@material-ui/icons/src/ArrowBack'
import pick from 'lodash/pick';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { useGoogleMaps } from '../../form-components/LocationFormComponent';
import { pickBestReverseGeocodingResult } from '../../../lib/geocoding';
import classNames from 'classnames';
import { markdownToHtmlSimple } from '../../../lib/editor/utils';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import { AnalyticsContext, useTracking } from '../../../lib/analyticsEvents';
import { useSingle } from '../../../lib/crud/withSingle';
import { Link } from "../../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../../lib/routeUtil";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 1000,
    margin: '0 auto',
    fontFamily: theme.palette.fonts.sansSerifStack,
    '& input.geosuggest__input': {
      width: '100%'
    }
  },
  heading: {
    padding: '0 15px',
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
      paddingTop: 30
    }
  },
  subheading: {
    padding: '0 15px',
    marginBottom: 40
  },
  loggedOutView: {
    textAlign: 'center'
  },
  loggedOutMessage: {
    padding: '0 15px',
    marginTop: 40,
  },
  loggedOutMessageHighlight: {
    color: theme.palette.primary.dark
  },
  loggedOutLink: {
    fontWeight: 'bold',
    color: theme.palette.primary.main
  },
  noAppText: {
    padding: '20px 15px',
  },
  contactUs: {
    color: theme.palette.primary.main
  },
  callout: {
    background: theme.palette.grey[60],
    padding: '20px 30px 25px',
    margin: '0 15px',
  },
  overwriteText: {
    marginBottom: 15
  },
  overwriteBtnAltText: {
    display: 'inline',
    color: theme.palette.grey[700],
    fontSize: '1rem',
    marginLeft: 15
  },
  
  form: {
    marginTop: 40,
  },
  btnRow: {
    display: 'grid',
    gridTemplateColumns: '140px 350px 90px 342px',
    gridGap: '15px',
    alignItems: 'baseline',
    padding: 15,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '140px 350px 90px 342px',
    gridGap: '15px',
    alignItems: 'baseline',
    padding: 15,
    '&:hover': {
      backgroundColor: theme.palette.grey[55]
    }
  },
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: '24px',
    fontWeight: 'bold',
  },
  input: {
    fontSize: 14,
    padding: '5px 10px',
    border: theme.palette.border.slightlyIntense2,
    borderRadius: 4,
    '&:focus': {
      border: theme.palette.border.slightlyIntense2,
    }
  },
  arrowCol: {
    gridColumnStart: 3,
    textAlign: 'center'
  },
  copyAllBtn: {
    backgroundColor: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.primary.main,
    padding: '7px 14px',
    borderRadius: 4,
    border: '2px solid transparent',
    borderColor: theme.palette.primary.main,
    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
      color: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    }
  },
  arrowBtn: {
    backgroundColor: 'transparent',
    fontSize: 20,
    color: theme.palette.primary.main,
    padding: 5,
    borderRadius: '50%',
    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.primary.dark,
    }
  },
  arrowIcon: {
    verticalAlign: 'middle',
  },
  importedText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '22px',
  },
  submitBtnCol: {
    gridColumnStart: 4,
    alignSelf: 'center',
    textAlign: 'right'
  },
  cancelLink: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[600],
    marginRight: 40
  },
  submitBtn: {
    width: 'max-content',
    backgroundColor: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[0],
    padding: '10px 20px',
    borderRadius: 4,
    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.grey[500]
    }
  }
})

type EAGApplicationDataType = {
  jobTitle?: string,
  organization?: string,
  careerStage?: string[],
  biography: {
    markdownValue: string,
    ckEditorValue: string
  },
  howOthersCanHelpMe: {
    markdownValue: string,
    ckEditorValue: string
  },
  howICanHelpOthers: {
    markdownValue: string,
    ckEditorValue: string
  },
  mapLocation?: string,
  linkedinProfileURL?: string
}

type EditorFormComponentRefType = {
  setEditorValue: (newValue: string) => void
}


// Wrapper around EAGApplicationImportForm which fetches the current user with
// the UsersEdit fragment so that it will have all the fields to be able to
// edit bio, howICanHelpOthers.
const EAGApplicationImportFormWrapperInner = () => {
  const currentUser = useCurrentUser()
  const { Loading, EAGApplicationImportForm } = Components;
  const { document: currentUserEdit, loading } = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersEdit",
    skip: !currentUser,
  });
  
  if (!currentUser || !currentUserEdit) {
    return <Loading/>
  }
  
  return <EAGApplicationImportForm
    currentUser={currentUserEdit}
  />
}

const EAGApplicationImportFormInner = ({currentUser, classes}: {
  currentUser: UsersEdit,
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation()
  const { flash } = useMessages()
  const { captureEvent } = useTracking()
  const [mapsLoaded, googleMaps] = useGoogleMaps()
  // only used for initializing the form
  const [formLoading, setFormLoading] = useState(true)
  // the event associated with the application data (ex. "EA Global: Washington DC") -
  // we have a default since some applications don't have this info
  const [event, setEvent] = useState<string>('a past EA Global')
  const [importedData, setImportedData] = useState<EAGApplicationDataType|null>(null)
  // used to disable buttons when submitting the form
  const [submitLoading, setSubmitLoading] = useState(false)
  
  useEffect(() => {
    // try to pull the latest EAG application data that is associated with the current user's email address
    const fetchData = async () => {
      const response = await fetch("/api/eag-application-data", {method: "GET"})
      if (!response.ok) {
        setFormLoading(false)
        return
      }

      const json = await response.json()
      const eagData = json?.data?.length && json.data[0]
      if (eagData) {
        // the name of the specific event they applied for could be in any of these array fields
        ['Which_Event', 'Which_event_s_are_you_registering_for_EA_Globa', 'Which_event_s_are_you_applying_to_registering_for', 'Which_event_s_are_you_registering_for'].forEach(field => {
          if (eagData[field]?.length) {
            setEvent(eagData[field][0])
          }
        })
        
        // our list of career stages is a subset of EAG's list,
        // except that we use "Seeking work" instead of "Seeking work / Not currently working"
        const careerStage = eagData.What_stage_of_your_career_are_you_in
        // check the speaker-only bio field, otherwise the closest other field I could find was "Path to impact"
        const bio = eagData.Brief_bio_150_words_maximum || eagData.Path_to_impact || ''
        const howOthersCanHelpMe = eagData.What_are_you_hoping_to_get_out_of_the_event_and_h || ''
        const howICanHelpOthers = eagData.How_can_you_help_the_other_attendees_at_the_event || ''
        
        setImportedData({
          jobTitle: eagData.What_is_your_job_title_or_current_role,
          organization: eagData.Where_do_you_work,
          careerStage: careerStage?.map((stage: string) => CAREER_STAGES.find(s => stage.includes(s.label))?.value)?.filter((stage?: string) => !!stage),
          biography: {
            markdownValue: bio,
            ckEditorValue: markdownToHtmlSimple(bio)
          },
          howOthersCanHelpMe: {
            markdownValue: howOthersCanHelpMe,
            ckEditorValue: markdownToHtmlSimple(howOthersCanHelpMe)
          },
          howICanHelpOthers: {
            markdownValue: howICanHelpOthers,
            ckEditorValue: markdownToHtmlSimple(howICanHelpOthers)
          },
          mapLocation: eagData.Your_nearest_city,
          linkedinProfileURL: eagData.LinkedIn_URL || eagData.LinkedIn_profile_summary
        })
      }
      setFormLoading(false)
    }
    // eslint-disable-next-line no-console
    fetchData().catch(console.error)
  }, [])
  
  const formFields = [
    'jobTitle',
    'organization',
    'careerStage',
    // 'biography',
    // 'howOthersCanHelpMe',
    // 'howICanHelpOthers',
    // 'organizerOfGroupIds', // TODO: implement later - for the first release I decided this wasn't worth the effort to include
    'mapLocation',
    'linkedinProfileURL',
  ] as const
  // formValues holds the state of the form EXCEPT for CKEditor fields, which have their own state
  // TODO: pick should be correctly typed, but it can't be right now because currentUser can be null
  const [formValues, setFormValues] = useState(pick(currentUser, formFields))

  // these are used to access CKEditor fields, to copy over the imported data
  const biographyRef = useRef<EditorFormComponentRefType>(null)
  const howOthersCanHelpMeRef = useRef<EditorFormComponentRefType>(null)
  const howICanHelpOthersRef = useRef<EditorFormComponentRefType>(null)
  // CKEditor fields use this to insert their data before we submit the form
  const submitFormCallbacks = useRef<Array<Function>>([])
  // CKEditor fields use this to clear local storage after successfully submitting the form
  const successFormCallbacks = useRef<Array<Function>>([])
  
  const updateCurrentUser = useUpdateCurrentUser()
  
  const importMapLocation = async () => {
    if (mapsLoaded && importedData?.mapLocation) {
      // get a list of matching Google locations for the current lat/lng (reverse geocoding)
      const geocoder = new googleMaps.Geocoder()
      const geocodingResponse = await geocoder.geocode({
        address: importedData.mapLocation
      })
      const results = geocodingResponse?.results
      if (results?.length) {
        return pickBestReverseGeocodingResult(results)
      }
    }
    return null
  }
  
  const importLinkedinProfileURL = () => {
    // try to get the relevant snippet of the linkedin profile URL
    const matches = importedData?.linkedinProfileURL?.match(/linkedin\.com\/in\/(\S+)/i)
    return matches?.length ? matches[1] : ''
  }
  
  const handleCopyAll = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!importedData) return

    // @ts-ignore TODO
    setFormValues({
      ...importedData,
      mapLocation: await importMapLocation(),
      linkedinProfileURL: importLinkedinProfileURL()
    })
    // update CKEditor fields
    biographyRef?.current?.setEditorValue(importedData.biography.markdownValue)
    howOthersCanHelpMeRef?.current?.setEditorValue(importedData.howOthersCanHelpMe.markdownValue)
    howICanHelpOthersRef?.current?.setEditorValue(importedData.howICanHelpOthers.markdownValue)
  }
  
  const handleCopyField = async (e: React.MouseEvent<HTMLButtonElement>, field: keyof EAGApplicationDataType) => {
    e.preventDefault()
    if (!importedData) return
    
    switch (field) {
      case 'biography':
        biographyRef?.current?.setEditorValue(importedData.biography.markdownValue)
        return
      case 'howOthersCanHelpMe':
        howOthersCanHelpMeRef?.current?.setEditorValue(importedData.howOthersCanHelpMe.markdownValue)
        return
      case 'howICanHelpOthers':
        howICanHelpOthersRef?.current?.setEditorValue(importedData.howICanHelpOthers.markdownValue)
        return
      // case 'organizerOfGroupIds':
      //   // TODO: this field needs more work -
      //   // prob need to only list groups they are assigned to on the forum, and link to the form for requests
      //   setFormValues(currentValues => {
      //     return {
      //       ...currentValues,
      //       [field]: importedData.organizerOfGroups.map(g => g._id)
      //     }
      //   })
      //   return
      case 'mapLocation':
        const location = await importMapLocation()
        if (location) {
          setFormValues(currentValues => {
            return {
              ...currentValues,
              mapLocation: location
            }
          })
        }
        return
      case 'linkedinProfileURL':
        setFormValues(currentValues => {
          return {
            ...currentValues,
            linkedinProfileURL: importLinkedinProfileURL()
          }
        })
        return
      default:
        break
    }
    
    setFormValues(currentValues => {
      return {
        ...currentValues,
        [field]: importedData[field]
      }
    })
  }
  
  const handleChangeField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof EAGApplicationDataType) => {
    e.preventDefault()
    const val = e.target.value
    setFormValues(currentValues => {
      return {
        ...currentValues,
        [field]: val
      }
    })
  }
  
  const handleUpdateValue = async <T extends {}>(val: T) => {
    setFormValues(currentValues => {
      return {
        ...currentValues,
        ...val
      }
    })
  }
  
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>, copyAll=false) => {
    e.preventDefault()
    
    let updatedFormData = {...formValues}
    if (copyAll && importedData) {
      // @ts-ignore
      updatedFormData = {
        ...importedData,
        mapLocation: await importMapLocation(),
        linkedinProfileURL: importLinkedinProfileURL()
      }
      // update CKEditor fields
      // biographyRef?.current?.setEditorValue(importedData.biography.markdownValue)
      // howOthersCanHelpMeRef?.current?.setEditorValue(importedData.howOthersCanHelpMe.markdownValue)
      // howICanHelpOthersRef?.current?.setEditorValue(importedData.howICanHelpOthers.markdownValue)
    }
    
    for (let field in updatedFormData) {
      type UpdatedFormDataKey = keyof typeof updatedFormData;
      if (Array.isArray(updatedFormData[field as UpdatedFormDataKey]) && !updatedFormData[field as UpdatedFormDataKey].length) {
        updatedFormData[field as UpdatedFormDataKey] = null
      }
    }
    
    // add data from CKEditor fields
    try {
      updatedFormData = submitFormCallbacks.current.reduce((prev, next) => {
        return next(prev)
      }, updatedFormData)
    } catch (e) {
      flash({messageString: "Sorry, we were unable to submit your changes. Please try again later."})
      return
    }

    setSubmitLoading(true)
    setFormValues(updatedFormData)

    updateCurrentUser(updatedFormData).then(() => {
      captureEvent('eagApplicationImported', {copyAll})
      // clear out local storage for CKEditor fields
      successFormCallbacks.current.reduce((prev, next) => {
        try {
          return next(prev)
        } catch (e) {
          return prev
        }
      }, updatedFormData)
      navigate(userGetProfileUrl(currentUser))
    }, (e) => {
      // eslint-disable-next-line no-console
      console.error(e)
      setSubmitLoading(false)
    })
  }
  
  const { Typography, MultiSelect, LocationPicker,
    PrefixedInput, ContentStyles, Loading } = Components

  if (!currentUser) {
    return (
      <AnalyticsContext pageContext="eagApplicationImportForm">
        <div className={classNames(classes.root, classes.loggedOutView)}>
          <Typography variant="display3" className={classes.heading} gutterBottom>
            Welcome to the &#10024; <span className={classes.loggedOutMessageHighlight}>Effective Altruism Forum</span> &#10024;
          </Typography>
          <Typography variant="body2" className={classes.loggedOutMessage}>
            <a href={`/auth/auth0?returnTo=${pathname}`} className={classes.loggedOutLink}>Login</a> or <a href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`} className={classes.loggedOutLink}>Sign Up</a> to
            import information from your EA Global application to your EA Forum profile.
          </Typography>
        </div>
      </AnalyticsContext>
    );
  }
    
  const body = !importedData ? <>
    <Typography variant="body2" className={classes.noAppText}>
      Sorry, we found no EA Global applications matching your EA Forum account's email address.
    </Typography>
    <Typography variant="body2" className={classes.subheading}>
      If you feel that this is in error, please <Link to="/contact" className={classes.contactUs}>contact us</Link>.
    </Typography>
  </> : <>
    <Typography variant="body2" className={classes.subheading}>
      We've found your application data from {event}.
    </Typography>
    
    <AnalyticsContext pageSectionContext="overwriteCallout">
      <div className={classes.callout}>
        <Typography variant="body2" className={classes.overwriteText}>
          Would you like to overwrite your EA Forum profile data?
        </Typography>
        <div>
          <button type="submit"
            onClick={(e) => handleSubmit(e, true)}
            className={classes.submitBtn}
            {...submitLoading ? {disabled: true} : {}}
          >
            Overwrite and Submit
          </button>
          <Typography variant="body2" className={classes.overwriteBtnAltText}>
            or see details and make changes below
          </Typography>
        </div>
      </div>
    </AnalyticsContext>
    
    <form className={classes.form}>
      <div className={classes.btnRow}>
        <div className={classes.arrowCol}>
          <button className={classes.copyAllBtn} onClick={handleCopyAll}>
            <ArrowBack className={classes.arrowIcon} />
            <div>Copy All</div>
          </button>
        </div>
        <div className={classes.submitBtnCol}></div>
      </div>
      
      <div className={classes.formRow}>
        <label className={classes.label}>Role</label>
        <Input name="jobTitle" value={formValues.jobTitle ?? undefined} onChange={(e) => handleChangeField(e, 'jobTitle')} />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'jobTitle')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>{importedData.jobTitle}</div>
      </div>
    
      <div className={classes.formRow}>
        <label className={classes.label}>Organization</label>
        <Input name="organization" value={formValues.organization ?? undefined} onChange={(e) => handleChangeField(e, 'organization')} />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'organization')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>{importedData.organization}</div>
      </div>
      
      <div className={classes.formRow}>
        <label className={classes.label}>Career stage</label>
        <MultiSelect
          options={CAREER_STAGES}
          value={formValues.careerStage || []}
          placeholder="Select all that apply"
          separator={'\r\n'}
          setValue={(value) => {
            void handleUpdateValue({
              careerStage: value
            });
          }}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'careerStage')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>
          {importedData.careerStage?.map(stage => {
            const careerStage = CAREER_STAGES.find(s => stage === s.value)
            if (!careerStage) {
              return ''
            }
            return <div key={careerStage.value}>{careerStage.label}</div>
          })}
        </div>
      </div>
      
      {/* <div className={classes.formRow}>
        <label className={classes.label}>Bio</label>
        <EditorFormComponent
          ref={biographyRef}
          document={currentUser}
          name="biography"
          value={currentUser.biography?.ckEditorMarkup}
          {...getSchema(Users).biography}
          {...getSchema(Users).biography.form}
          label=""
          addToSubmitForm={data => submitFormCallbacks.current.push(data)}
          addToSuccessForm={data => successFormCallbacks.current.push(data)}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'biography')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <ContentStyles contentType="comment">
          <div dangerouslySetInnerHTML={{__html: importedData.biography.ckEditorValue}}></div>
        </ContentStyles>
      </div>
      
      <div className={classes.formRow}>
        <label className={classes.label}>How others can help me</label>
        <EditorFormComponent
          ref={howOthersCanHelpMeRef}
          document={currentUser}
          name="howOthersCanHelpMe"
          value={currentUser.howOthersCanHelpMe?.ckEditorMarkup}
          {...getSchema(Users).howOthersCanHelpMe}
          {...getSchema(Users).howOthersCanHelpMe.form}
          label=""
          addToSubmitForm={data => submitFormCallbacks.current.push(data)}
          addToSuccessForm={data => successFormCallbacks.current.push(data)}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'howOthersCanHelpMe')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <ContentStyles contentType="comment">
          <div dangerouslySetInnerHTML={{__html: importedData.howOthersCanHelpMe.ckEditorValue}}></div>
        </ContentStyles>
      </div>
      
      <div className={classes.formRow}>
        <label className={classes.label}>How I can help others</label>
        <EditorFormComponent
          ref={howICanHelpOthersRef}
          document={currentUser}
          name="howICanHelpOthers"
          value={currentUser.howICanHelpOthers?.ckEditorMarkup}
          {...getSchema(Users).howICanHelpOthers}
          {...getSchema(Users).howICanHelpOthers.form}
          label=""
          addToSubmitForm={data => submitFormCallbacks.current.push(data)}
          addToSuccessForm={data => successFormCallbacks.current.push(data)}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'howICanHelpOthers')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <ContentStyles contentType="comment">
          <div dangerouslySetInnerHTML={{__html: importedData.howICanHelpOthers.ckEditorValue}}></div>
        </ContentStyles>
      </div> */}
      
      {/* <div className={classes.formRow}>
        <label className={classes.label}>Organizer of</label>
        <SelectLocalgroup
          currentUser={currentUser}
          value={formValues.organizerOfGroupIds || []}
          label="Organizer of"
          separator={'\r\n'}
          multiselect={true}
          path="organizerOfGroupIds"
          updateCurrentValues={handleUpdateValue}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'organizerOfGroupIds')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>{importedData.organizerOfGroups?.map(group => {
          return <div key={group._id}>{group.name}</div>
        })}</div>
      </div> */}
      
      <div className={classes.formRow}>
        <label className={classes.label}>Public map location</label>
        <LocationPicker
          document={currentUser}
          value={formValues.mapLocation}
          path="mapLocation"
          updateCurrentValues={handleUpdateValue}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'mapLocation')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>{importedData.mapLocation}</div>
      </div>
      
      <div className={classes.formRow}>
        <label className={classes.label}>LinkedIn profile</label>
        {/* @ts-ignore: We're skipping some props here, but it should be safe */}
        <PrefixedInput
          field={{
            name: 'linkedinProfileURL',
            state: { value: formValues.linkedinProfileURL ?? '' },
            handleChange: (newLinkedInProfileURL) => handleUpdateValue({ linkedinProfileURL: newLinkedInProfileURL }),
          }}
          inputPrefix={SOCIAL_MEDIA_PROFILE_FIELDS.linkedinProfileURL}
        />
        <div className={classes.arrowCol}>
          <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'linkedinProfileURL')}>
            <ArrowBack className={classes.arrowIcon} />
          </button>
        </div>
        <div className={classes.importedText}>{importedData.linkedinProfileURL}</div>
      </div>
      
      <div className={classes.btnRow}>
        <div className={classes.submitBtnCol}>
          <Link to={userGetProfileUrl(currentUser)} className={classes.cancelLink}>
            Cancel
          </Link>
          <button type="submit" onClick={handleSubmit} className={classes.submitBtn} {...submitLoading ? {disabled: true} : {}}>
            Submit
          </button>
        </div>
      </div>
    </form>
  </>
  
  return <AnalyticsContext pageContext="eagApplicationImportForm">
    <div className={classes.root}>
      <Typography variant="display3" className={classes.heading} gutterBottom>
        Import your profile
      </Typography>

      {formLoading ? <Loading /> : body}
    </div>
  </AnalyticsContext>
}


export const EAGApplicationImportFormWrapper = registerComponent('EAGApplicationImportFormWrapper', EAGApplicationImportFormWrapperInner);
export const EAGApplicationImportForm = registerComponent('EAGApplicationImportForm', EAGApplicationImportFormInner, {styles});

declare global {
  interface ComponentTypes {
    EAGApplicationImportFormWrapper: typeof EAGApplicationImportFormWrapper
    EAGApplicationImportForm: typeof EAGApplicationImportForm
  }
}
