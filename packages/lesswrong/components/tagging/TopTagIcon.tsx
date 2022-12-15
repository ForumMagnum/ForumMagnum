import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import PeopleIcon from '@material-ui/icons/People';
import EarthIcon from '@material-ui/icons/Public';
import GavelIcon from '@material-ui/icons/Gavel';
import { DnaIcon } from '../icons/dnaIcon';
import { MushroomCloudIcon } from '../icons/mushroomCloudIcon';
import { GlobeIcon } from '../icons/globeIcon';
import { ScrollIcon } from '../icons/scrollIcon';
import { BirdIcon } from '../icons/birdIcon';
import { ChickenIcon } from '../icons/chickenIcon';
import { ChoiceIcon } from '../icons/choiceIcon';
import { ChipIcon } from '../icons/chipIcon';
import { GiveIcon } from '../icons/giveIcon';
import { forumSelect } from '../../lib/forumTypeUtils';

// Mapping from tag slug to icon
// Don't want to fight the type system about the type of the MUI icon
const topTagIconMap = forumSelect<Record<string, any>>({
  EAForum: {
    biosecurity: DnaIcon,
    'existential-risk': MushroomCloudIcon,
    'cause-prioritization': GlobeIcon,
    'moral-philosophy': ScrollIcon,
    'wild-animal-welfare': BirdIcon,
    'farmed-animal-welfare': ChickenIcon,
    'effective-altruism-groups': PeopleIcon,
    'career-choice': ChoiceIcon,
    'ai-risk': ChipIcon,
    'global-health-and-development': EarthIcon,
    'policy': GavelIcon,
    'effective-giving': GiveIcon,
  },
  default: {}
})

const TopTagIcon = ({tag}: {tag: TagBasicInfo}) => {
  const Icon = topTagIconMap[tag.slug]
  if (!Icon) return null
  return <Icon />
}

const TopTagIconComponent = registerComponent("TopTagIcon", TopTagIcon);

declare global {
  interface ComponentTypes {
    TopTagIcon: typeof TopTagIconComponent
  }
}
