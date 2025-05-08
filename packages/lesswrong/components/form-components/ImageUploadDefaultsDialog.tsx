import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { DialogContent } from '../widgets/DialogContent';
import { DialogTitle } from '../widgets/DialogTitle';


const styles = (theme: ThemeType) => ({
  images: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly'
  },
  image: {
    padding: '5px 5px 2px',
    margin: 3,
    border: '2px solid transparent',
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
})

const ImageUploadDefaultsDialogInner = ({ onSelect, onClose, classes, type }: {
  onSelect: (newImageId: string) => void,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
  type?: 'Event' | 'Profile'
}) => {

  const { LWDialog, CloudinaryImage2 } = Components
  
  const selectImg = (img: string) => {
    onSelect(img)
    if (onClose)
      onClose();
  }
  
  // these are EA Forum-specific
  const imageType = type ?? "Event"
  const defaultImages = { "Event" : [
      'Event/defaults/ucbrkw7gdmacm4soorui', // clouds
      'Event/defaults/k7bdilxm08silijqdn2v', // sprout
      
      'Event/defaults/kaib61wcuwtsgmq6elrs', // autumn trail
      'Event/defaults/hlmllj77ln4nr69fn7jf', // birds
      
      'Event/defaults/astdsmglxtbcehnlo7g4', // group hike
      'Event/defaults/zhiyjstbfu1olxfbnuci', // group picnic
      
      'Event/defaults/fg3ttihepxfss9ylun4f', // dog on hill
      'Event/defaults/dqknjubfjt2crsmdspsw', // veggies
    
      'Event/defaults/gtst9i5zvxk9hulnwigm', // books & coffee
      'Event/defaults/as81227r6jx8m4hydhb3', // bookshelf
      
      'Event/defaults/qdfqhekgmxtf2wbdbrq3', // desk with laptop & notebook
      'Event/defaults/y1bt55znqoc2lvec70wp', // code
      
      'Event/defaults/qvujytx4nomsrm3xu7on', // two people working
      'Event/defaults/myksyxm0e1qszlbzzj9o', // post-its on wall
    
      'Event/defaults/fsgbi942lcnepj7zylr5', // coffee hangout
      'Event/defaults/dgjptfxhtomlt5s96wgn', // wine hangout
    
      'Event/defaults/akwwm4hecuwypw5ixte0', // outdoor party
      'Event/defaults/b8xpbqpegclnvc8x0taw', // sparkler
      
      'Event/defaults/cq99vatplysmhlv6drai', // virtual meeting
      'Event/defaults/fs5rgzbtdnbcdegiszbw', // butterfly
      
      'Event/defaults/h4jbx7exu0ttrcopmvcy', // elephants
      'Event/defaults/ycj85pqkcvp8q91rqn87', // sheep
      
      'Event/defaults/np7kecliyzhnlogyxelp', // pugsworth
      'Event/defaults/diddy0dxe7lfoxnwtlvq', // jellyfish
    
      'Event/defaults/uqi9pobdxb9dxbpomep0', // cells
      'Event/defaults/mtkocedjg5zx99ghkxnw', // pipette
    
      'Event/defaults/s4pkf3kuhnigiov8effy', // coins
      'Event/defaults/ijfeayyzhxixbrxzvmm5', // lightbulb
      
      'Event/defaults/dic1sxm86xcvoavnhpnn', // wind farm & field
      'Event/defaults/gumqg9zryaqirtldgast', // lake & mountains
    
      'Event/defaults/ubobbqry5uowozmptjop', // earth
      'Event/defaults/n33epog75uk7c1dgciod', // starry night
    ],
    "Profile" : [
      'Profile/defaults/image_part_001',
      'Profile/defaults/image_part_002',
      'Profile/defaults/image_part_003',
      'Profile/defaults/image_part_004',
      'Profile/defaults/image_part_005',
      'Profile/defaults/image_part_006',
      'Profile/defaults/image_part_007',
      'Profile/defaults/image_part_008',
      'Profile/defaults/image_part_009',
      'Profile/defaults/image_part_010',
      'Profile/defaults/image_part_011',
      'Profile/defaults/image_part_012'
    ]
  }

  const imageTypeStartsWithVowel = /^[aeiouAEIOU]/gm.test(imageType)
  
  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Select {imageTypeStartsWithVowel? "an" : "a"} { imageType } Image
      </DialogTitle>
      <DialogContent>
        <div className={classes.images}>
          {[...defaultImages[imageType]].map((img) => {
            return <div key={img}
              className={classes.image}
              onClick={() => selectImg(img)}
              onKeyDown={(e) => {
                // pressing the "Enter" key selects the image
                if (e.keyCode === 13) {
                  e.preventDefault()
                  selectImg(img)
                }
              }}
              tabIndex={0}
            >
                <CloudinaryImage2
                  publicId={img}
                  width={240}
                  height={125}
                  imgProps={{q: '100'}}
                />
            </div>
          })}
        </div>
      </DialogContent>
    </LWDialog>
  )
}

export const ImageUploadDefaultsDialog = registerComponent('ImageUploadDefaultsDialog', ImageUploadDefaultsDialogInner, {styles});

declare global {
  interface ComponentTypes {
    ImageUploadDefaultsDialog: typeof ImageUploadDefaultsDialog
  }
}
