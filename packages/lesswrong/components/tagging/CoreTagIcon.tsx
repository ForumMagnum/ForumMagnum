import React, { FC, ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { DnaIcon } from '../icons/dnaIcon';
import { MushroomCloudIcon } from '../icons/mushroomCloudIcon';
import { CausePrioIcon } from '../icons/causePrioIcon';
import { ScrollIcon } from '../icons/scrollIcon';
import { BirdIcon } from '../icons/birdIcon';
import { ChickenIcon } from '../icons/chickenIcon';
import { ChoiceIcon } from '../icons/choiceIcon';
import { AiIcon } from '../icons/aiIcon';
import { GiveIcon } from '../icons/giveIcon';
import { TelescopeIcon } from '../icons/telescopeIcon';
import { GhdIcon } from '../icons/ghdIcon';
import { GroupsIcon } from '../icons/groupsIcon';
import { PolicyIcon } from '../icons/policyIcon';
import { forumSelect } from '../../lib/forumTypeUtils';
import { LotusOutlineIcon } from '../icons/lotusIcon';
import classNames from 'classnames';

// Mapping from tag slug to icon
export const getCoreTagIconMap = () => forumSelect<Record<string, FC<{className?: string}>>>({
  default: {}
})

const styles = (theme: ThemeType) => ({
  // prevent LotusOutlineIcon from having a fill
  noFill: {
    fill: 'none !important'
  }
});

const CoreTagIcon = ({tag, fallbackNode, className, classes}: {
  tag: {slug: string},
  fallbackNode?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>
}) => {
  const Icon = getCoreTagIconMap()[tag.slug]
  if (!Icon) {
    return fallbackNode ? <>{fallbackNode}</> : null
  }
  return <Icon className={classNames(className, {[classes.noFill]: Icon === LotusOutlineIcon})} />
}

export default registerComponent("CoreTagIcon", CoreTagIcon, {styles});


