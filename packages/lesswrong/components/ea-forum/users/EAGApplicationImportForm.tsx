
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useCurrentUser } from '../../common/withUser';
import Users from '../../../lib/vulcan-users';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { useNavigation } from '../../../lib/routeUtil';
import { useUpdate } from '../../../lib/crud/withUpdate';
import ArrowBack from '@material-ui/icons/ArrowBack'
import pick from 'lodash/pick';
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS } from '../../../lib/collections/users/custom_fields';
import Input from '@material-ui/core/Input';
import { getSchema } from '../../../lib/utils/getSchema';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 900,
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
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    padding: '0 15px',
    marginBottom: 40
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
    gridTemplateColumns: '140px 300px 90px 300px',
    gridGap: '15px',
    alignItems: 'baseline',
    padding: 15,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '140px 300px 90px 300px',
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
    textAlign: 'center'
  },
  submitBtn: {
    backgroundColor: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[0],
    padding: '10px 18px',
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
  
  const formFields = [
    'jobTitle',
    'organization',
    'careerStage',
    'biography',
    'howOthersCanHelpMe',
    'howICanHelpOthers',
    'organizerOfGroupIds',
    'mapLocation',
    'linkedinProfileURL',
  ]
  
  const [formValues, setFormValues]:any = useState(pick(currentUser, formFields))
  
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersProfileEdit',
  })
  
  const importedData:any = {
    jobTitle: 'My job',
    organization: 'Org',
    careerStage: [],
    biography: 'Hello',
    organizerOfGroupIds: [],
    mapLocation: {formatted_address: ''},
    linkedinProfileURL: 'sarahycheng'
  }

  if (!currentUser) {
    return (
      <div className={classes.root}>
        Log in or sign up to import your profile information
      </div>
    );
  }
  
  const handleCopyAll = (e) => {
    e.preventDefault()
    setFormValues(importedData)
  }
  
  const handleCopyField = (e, field) => {
    e.preventDefault()
    console.log('copy', field)
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
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('submit')
    // await updateUser({
    //   selector: { _id: currentUser._id },
    //   data: {
    //     hideFrontpageBook2019Ad: true
    //   },
    // })
    // history.push(userGetProfileUrl(currentUser))
  }
  
  const { Typography, FormComponentMultiSelect, EditorFormComponent, SelectLocalgroup, LocationFormComponent,
    PrefixedInput } = Components
  
  // console.log(getSchema(Users))
  // console.log(getSchema(Users).biography)
  
  return (
    <div className={classes.root}>
      <Typography variant="display3" className={classes.heading} gutterBottom>
        Import Profile from EA Global Application
      </Typography>
      <div className={classes.subheading}>All fields are optional</div>
      
      <form className={classes.form}>
        <div className={classes.btnRow}>
          <div className={classes.arrowCol}>
            <button className={classes.copyAllBtn} onClick={handleCopyAll}>
              <ArrowBack className={classes.arrowIcon} />
              <div>Copy All</div>
            </button>
          </div>
          <div className={classes.submitBtnCol}>
            <button type="submit" onClick={handleSubmit} className={classes.submitBtn}>Submit</button>
          </div>
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
            value={formValues.careerStage}
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
          <div className={classes.importedText}>{importedData.careerStage}</div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>Bio</label>
          { /* @ts-ignore */ }
          <EditorFormComponent
            value={formValues.biography}
            {...getSchema(Users).biography}
          />
          <div className={classes.arrowCol}>
            <button className={classes.arrowBtn} onClick={(e) => handleCopyField(e, 'biography')}>
              <ArrowBack className={classes.arrowIcon} />
            </button>
          </div>
          <div className={classes.importedText}>{importedData.biography}</div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>Organizer of</label>
          <SelectLocalgroup
            currentUser={currentUser}
            value={formValues.organizerOfGroupIds}
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
          <div className={classes.importedText}>{importedData.careerStage}</div>
        </div>
        
        <div className={classes.formRow}>
          <label className={classes.label}>Public map location</label>
          <LocationFormComponent
            document={currentUser}
            value={formValues.organizerOfGroupIds}
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
