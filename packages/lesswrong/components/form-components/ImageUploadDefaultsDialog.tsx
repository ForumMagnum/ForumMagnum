import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';


const styles = (theme: ThemeType): JssStyles => ({
  images: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  image: {
    padding: '5px 5px 2px',
    margin: 10,
    border: '2px solid transparent',
    cursor: 'pointer',
    '&:hover': {
      borderColor: "rgba(0,0,0, 0.35)",
    },
  },
  imageSelected: {
    borderColor: theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  // submitButton: {
  //   color: theme.palette.primary.main,
  //   textTransform: 'uppercase'
  // },
  actions: {
    marginTop: 24
  },
})

const ImageUploadDefaultsDialog = ({ onSelect, onClose, classes }: {
  onSelect: Function,
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const [selectedImg, setSelectedImg] = useState('')

  const { Typography, LWDialog, CloudinaryImage } = Components
  
  const defaultImages = [
    'Event/defaults/kaib61wcuwtsgmq6elrs', // autumn trail
    'Event/defaults/k7bdilxm08silijqdn2v', // sprout
    'Event/defaults/ycj85pqkcvp8q91rqn87', // sheep
    'Event/defaults/jbj2f5n9aygqn3wjalx3', // lake and mountains
  ]
  
  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Choose between our default images
      </DialogTitle>
      <DialogContent>
        <div className={classes.images}>
          {...defaultImages.map((img) => {
            const selectedClass = img === selectedImg && classes.imageSelected
            return <div className={classNames(classes.image, selectedClass)} onClick={() => setSelectedImg(img)}>
              <CloudinaryImage
                publicId={img}
                width={240}
                height={135}
              />
            </div>
          })}
        </div>

        <DialogActions className={classes.actions}>
          <Button variant="contained" color="primary" className={classes.submitButton} onClick={() => {
            onSelect(selectedImg)
            onClose()
          }}>
            Save
          </Button>
        </DialogActions>
      </DialogContent>
    </LWDialog>
  )
}

const ImageUploadDefaultsDialogComponent = registerComponent('ImageUploadDefaultsDialog', ImageUploadDefaultsDialog, {styles});

declare global {
  interface ComponentTypes {
    ImageUploadDefaultsDialog: typeof ImageUploadDefaultsDialogComponent
  }
}
