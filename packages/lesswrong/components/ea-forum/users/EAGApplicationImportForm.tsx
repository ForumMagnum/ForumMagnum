
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React, { useRef, useState } from 'react';
import { useCurrentUser } from '../../common/withUser';
import Users from '../../../lib/vulcan-users';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import { useUpdate } from '../../../lib/crud/withUpdate';
import ArrowBack from '@material-ui/icons/ArrowBack'
import pick from 'lodash/pick';
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS } from '../../../lib/collections/users/custom_fields';
import Input from '@material-ui/core/Input';
import { getSchema } from '../../../lib/utils/getSchema';
import { useGoogleMaps } from '../../form-components/LocationFormComponent';
import { pickBestReverseGeocodingResult } from '../../../server/mapsUtils';
import classNames from 'classnames';
import { markdownToHtmlNoLaTeX } from '../../../lib/editor/utils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 1000,
    margin: '0 auto',
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
    // fontFamily: theme.typography.fontFamily,
    // fontSize: 13,
    // lineHeight: '20px',
    // color: theme.palette.grey[800],
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
    // display: 'grid',
    // gridTemplateColumns: 'repeat(3, 1fr)',
    // gridGap: '30px 20px',
    // alignItems: 'baseline',
    marginTop: 40,
  },
  btnRow: {
    display: 'grid',
    gridTemplateColumns: '140px 350px 90px 350px',
    gridGap: '15px',
    alignItems: 'baseline',
    padding: 15,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '140px 350px 90px 350px',
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
    // color: theme.palette.grey[800],
  },
  submitBtnCol: {
    gridColumnStart: 4,
    alignSelf: 'center',
    textAlign: 'right'
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
    }
  }
})

const EAGApplicationImportForm = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { history } = useNavigation()
  const { pathname } = useLocation()
  const [mapsLoaded, googleMaps] = useGoogleMaps()
  
  const formFields = [
    'jobTitle',
    'organization',
    'careerStage',
    'biography',
    'howOthersCanHelpMe',
    'howICanHelpOthers',
    // 'organizerOfGroupIds',
    'mapLocation',
    'linkedinProfileURL',
  ]
  
  const [formValues, setFormValues]:any = useState(pick(currentUser, formFields))
  // console.log(formValues.howOthersCanHelpMe)
  console.log('formValues.howOthersCanHelpMe?.ckEditorMarkup', formValues.howOthersCanHelpMe?.ckEditorMarkup)
  
  const biographyRef = useRef<HTMLInputElement>(null)
  const howOthersCanHelpMeRef = useRef<HTMLInputElement>(null)
  
  const submitFormCallbacks = useRef<Array<Function>>([])
  
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersProfileEdit',
  })
  
  const howOthersCanHelpMe = 'I hope to learn more about how the constituent organisations of the EA movement fit together, and how individuals think about their impact within that structure. I would like to hear as many different perspectives as possible from EAs with more experience in the community than myself (almost everyone).'

  const importedData:any = {
    jobTitle: 'Exec Assistant',
    organization: 'The Centre for Effective Altruism',
    careerStage: ['midCareer'],
    biography: {
      ckEditorMarkup: '',
      originalContents: {
        data: '',
        type: "ckEditorMarkup"
      }
    },
    howOthersCanHelpMe: howOthersCanHelpMe,
    howICanHelpOthers: {
      markdown: 'As a very newcomer to CEA and a relative newcomer to EA, my main purpose is to introduce myself, listen and learn. My experience is in politics, healthcare and research, so I can provide perspective and advice in these areas.',
    },
    organizerOfGroups: [],
    mapLocation: {formatted_address: 'London, UK'},
    linkedinProfileURL: ''
  }
  
  const importMapLocation = async () => {
    if (mapsLoaded) {
      // get a list of matching Google locations for the current lat/lng (reverse geocoding)
      const geocoder = new googleMaps.Geocoder()
      const geocodingResponse = await geocoder.geocode({
        address: importedData.mapLocation.formatted_address
      })
      const results = geocodingResponse?.results
      
      if (results?.length) {
        return pickBestReverseGeocodingResult(results)
      }
      // TODO: else?
    }
    return null
  }
  
  const handleCopyAll = async (e) => {
    e.preventDefault()
    setFormValues({
      ...importedData,
      mapLocation: await importMapLocation()
    })
  }
  
  const handleCopyField = async (e, field) => {
    e.preventDefault()
    console.log('copy', field)
    if (field === 'biography') {
      biographyRef.current.setEditorValue(importedData.biography?.ckEditorMarkup)
      return
    } else if (field === 'howOthersCanHelpMe') {
      howOthersCanHelpMeRef.current.setEditorValue(importedData.howOthersCanHelpMe)
      return
    // } else if (field === 'organizerOfGroupIds') {
    //   setFormValues({
    //     ...formValues,
    //     [field]: importedData.organizerOfGroups.map(g => g._id)
    //   })
    //   return
    } else if (field === 'mapLocation') {
      const location = await importMapLocation()
      if (location) {
        setFormValues({
          ...formValues,
          mapLocation: location
        })
      }
      return
    }
    
    setFormValues({
      ...formValues,
      [field]: importedData[field]
    })
  }
  
  const handleChangeField = (e, field) => {
    e.preventDefault()
    setFormValues({
      ...formValues,
      [field]: e.target.value
    })
  }
  
  const handleUpdateValue = (val) => {
    setFormValues({
      ...formValues,
      ...val
    })
  }
  
  const handleSubmit = async (e, copyAll=false) => {
    e.preventDefault()
    console.log('submit', formValues)
    console.log('submitFormCallbacks', submitFormCallbacks)
    let submission = copyAll ? {
      ...importedData,
      mapLocation: await importMapLocation()
    } : {...formValues}
    
    submission = submitFormCallbacks.current.reduce((prev, next) => {
      try {
        return next(prev)
      } catch (e) {
        console.log('error', e)
        return prev
      }
    }, submission)
    console.log('submission', submission)
    // await updateUser({
    //   selector: { _id: currentUser._id },
    //   data: {
    //     hideFrontpageBook2019Ad: true
    //   },
    // })
    // history.push(userGetProfileUrl(currentUser))
  }
  
  const { Typography, FormComponentMultiSelect, EditorFormComponent, SelectLocalgroup, LocationFormComponent,
    PrefixedInput, ContentStyles } = Components

  if (!currentUser) {
    return (
      <div className={classNames(classes.root, classes.loggedOutView)}>
        <Typography variant="display3" className={classes.heading} gutterBottom>
          Welcome to the &#10024; <span className={classes.loggedOutMessageHighlight}>Effective Altruism Forum</span> &#10024;
        </Typography>
        <Typography variant="body1" className={classes.loggedOutMessage}>
          <a href={`/auth/auth0?returnTo=${pathname}`} className={classes.loggedOutLink}>Login</a> or <a href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`} className={classes.loggedOutLink}>Sign Up</a> to
          import information from your EA Global application to your EA Forum profile.
        </Typography>
      </div>
    );
  }
  
  // console.log(getSchema(Users))
  // console.log(getSchema(Users).biography)
  
  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.heading} gutterBottom>
        Import Your Profile
      </Typography>
      <Typography variant="body1" className={classes.subheading}>
        We've found your application data from EA Global London 2022.
      </Typography>
      
      <div className={classes.callout}>
        <Typography variant="body1" className={classes.overwriteText}>
          Would you like to overwrite your EA Forum profile data?
        </Typography>
        <div>
          <button type="submit" onClick={(e) => handleSubmit(e, true)} className={classes.submitBtn}>Overwrite and Submit</button>
          <Typography variant="body1" className={classes.overwriteBtnAltText}>
            or see details and make changes below
          </Typography>
        </div>
      </div>
      
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
          <Input name="jobTitle" value={formValues.jobTitle} onChange={(e) => handleChangeField(e, 'jobTitle')} />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'jobTitle')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <div className={classes.importedText}>{importedData.jobTitle}</div>
        </div>
      
        <div className={classes.formRow}>
          <label className={classes.label}>Organization</label>
          <Input name="organization" value={formValues.organization} onChange={(e) => handleChangeField(e, 'organization')} />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'organization')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <div className={classes.importedText}>{importedData.organization}</div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>Career stage</label>
          <FormComponentMultiSelect
            options={CAREER_STAGES}
            value={formValues.careerStage || []}
            placeholder="Career stage"
            separator={'\r\n'}
            path="careerStage"
            updateCurrentValues={handleUpdateValue}
          />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'careerStage')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <div className={classes.importedText}>
            {importedData.careerStage?.map(stage => {
              const careerStage = CAREER_STAGES.find(s => s.value === stage)
              if (!careerStage) {
                return ''
              }
              return <div key={careerStage.value}>{careerStage.label}</div>
            })}
          </div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>Bio</label>
          { /* @ts-ignore */ }
          <EditorFormComponent
            ref={biographyRef}
            document={currentUser}
            fieldName="biography"
            value={currentUser.biography}
            {...getSchema(Users).biography}
            label=""
            addToSubmitForm={submitData => submitFormCallbacks.current.push(submitData)}
            addToSuccessForm={() => null}
          />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'biography')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <ContentStyles contentType='post'>{importedData.biography.markdown}</ContentStyles>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>How others can help me</label>
          { /* @ts-ignore */ }
          <EditorFormComponent
            ref={howOthersCanHelpMeRef}
            document={currentUser}
            fieldName="howOthersCanHelpMe"
            value={currentUser.howOthersCanHelpMe?.ckEditorMarkup}
            {...getSchema(Users).howOthersCanHelpMe}
            label=""
            addToSubmitForm={submitData => submitFormCallbacks.current.push(submitData)}
          />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'howOthersCanHelpMe')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <ContentStyles contentType="post">
            {importedData.howOthersCanHelpMe}
          </ContentStyles>
        </div>
        
        {/* <div className={classes.formRow}>
          <label className={classes.label}>How I can help others</label>
          <EditorFormComponent
            value={formValues.howICanHelpOthers}
            {...getSchema(Users).howICanHelpOthers}
          />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'howICanHelpOthers')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <div className={classNames(classes.importedText, classes.ckeditorText)}>{importedData.howICanHelpOthers}</div>
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
          <LocationFormComponent
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
          <div className={classes.importedText}>{importedData.mapLocation.formatted_address}</div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>LinkedIn profile</label>
          <PrefixedInput
            value={formValues.linkedinProfileURL}
            inputPrefix={SOCIAL_MEDIA_PROFILE_FIELDS.linkedinProfileURL}
            path="linkedinProfileURL"
            updateCurrentValues={handleUpdateValue}
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
            <button type="submit" onClick={handleSubmit} className={classes.submitBtn}>Submit</button>
          </div>
        </div>
      </form>
      
      {/* <WrappedSmartForm
        collection={Users}
        fields={[
          'jobTitle',
          'organization',
          'careerStage',
          'biography',
          'howOthersCanHelpMe',
          'howICanHelpOthers',
          'organizerOfGroupIds',
          'mapLocation',
          'website',
          'linkedinProfileURL',
          'facebookProfileURL',
          'twitterProfileURL',
          'githubProfileURL',
        ]}
        excludeHiddenFields={false}
        queryFragment={getFragment('UsersProfileEdit')}
        mutationFragment={getFragment('UsersProfileEdit')}
        successCallback={async (user) => {
          history.push(userGetProfileUrl(user))
        }}
      /> */}
    </div>
  )
}


const EAGApplicationImportFormComponent = registerComponent('EAGApplicationImportForm', EAGApplicationImportForm, {styles});

declare global {
  interface ComponentTypes {
    EAGApplicationImportForm: typeof EAGApplicationImportFormComponent
  }
}
