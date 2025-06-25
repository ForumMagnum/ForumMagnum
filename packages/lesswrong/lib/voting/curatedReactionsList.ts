import { namesAttachedReactions, NamesAttachedReactionType } from './reactions';

export const primaryReactionNames = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'shrug', 'thinking', 'surprise', 'seen', 'thanks'
];

export const emotionReactionNames = [
  'smile', 'laugh', 'disappointed', 'confused', 'roll', 'excitement', 'thumbs-up', 'thumbs-down', 'paperclip'
];

export const extendedReactionNames = [
  'changemind', 'insightful', 'heart', 'typo', 'why', 'offtopic', 'elaborate',
  'hitsTheMark', 'miss', 'crux', 'notacrux', 'locallyValid', 'locallyInvalid',
  'facilitation', 'unnecessarily-combative', 'yeswhatimean', 'strawman',
  'concrete', 'examples', 'clear', 'muddled', 'betTrue', 'betFalse',
  'scout', 'soldier', 'scholarship', 'taboo', 'coveredAlready', 'timecost'
];

export const likelihoodReactionNames = [
  '1percent', '10percent', '25percent', '40percent', '50percent', 
  '60percent', '75percent', '90percent', '99percent'
];

export const getAllCuratedReactionNames = (): string[] => {
  return [
    ...primaryReactionNames,
    ...emotionReactionNames,
    ...extendedReactionNames,
    ...likelihoodReactionNames
  ];
};

// Filter reactions to only include curated and non-deprecated ones
export const getCuratedActiveReactions = (searchText: string = ''): NamesAttachedReactionType[] => {
  const curatedNames = getAllCuratedReactionNames();
  const activeReacts = namesAttachedReactions.filter(r => 
    !r.deprecated && curatedNames.includes(r.name)
  );
  
  if (!searchText || !searchText.length) {
    return activeReacts;
  }
  
  const searchLower = searchText.toLowerCase();
  return activeReacts.filter(
    reaction => reaction.name.toLowerCase().startsWith(searchLower)
      || reaction.label.toLowerCase().startsWith(searchLower)
      || reaction.searchTerms?.some(searchTerm => searchTerm.toLowerCase().startsWith(searchLower))
  );
}; 
