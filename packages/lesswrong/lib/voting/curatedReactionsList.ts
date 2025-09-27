import { namesAttachedReactions, NamesAttachedReactionType } from './reactions';
import uniq from 'lodash/uniq';

// List View Sections
export const listPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'plus', 'shrug', 'thumbs-up', 'thumbs-down', 'seen', 
];

export const listEmotions = [
  'smile', 'laugh', 'sad', 'disappointed', 'confused', 'thinking', 'oops', 'surprise', 'excitement', 
];

export const listViewSectionB = [
  'changemind',   'changed-mind-on-point',
  'heart', 'goodpoint',
  'thanks', 'typo',      
  'why', 'resolved',  
  'beautiful',  'hat', 
  'offtopic', 'coveredAlready2',
];

export const listViewSectionC = [
  'strong-argument', 'weak-argument',
  'crux',         'notacrux',
  'hitsTheMark',  'miss',
  'strawman', 'nitpick', 
  'addc', 'bet',
  'llm-smell','bowels', 
  'moloch','paperclip',   
];

export const listViewSectionD = [
  'clear',        'muddled', 
  'scholarship', 'facilitation', 
  'concrete',     'examples',
  'scout',        'soldier',
  'unnecessarily-combative', 'sneer', 
];

// Grid View Sections
export const gridPrimary = [
  'agree', 'disagree', 'important', 'dontUnderstand', 'changemind', 'shrug', 'thinking', 'surprise', 'seen',  
];

export const gridEmotions = [
  'smile', 'laugh', 'disappointed', 'confused', 'excitement', 'thumbs-up', 'thumbs-down', 'thanks',
];

export const gridSectionB = [
  'crux',       'hitsTheMark',  'scout',     'facilitation',             'concrete',   'clear',
  'notacrux',   'miss',         'soldier',   'unnecessarily-combative','examples',   'strawman',     'muddled',
  // Newly added reactions
  'llm-smell', 'changed-mind-on-point', 'resolved', 'sneer', 'strong-argument', 'weak-argument', 'bet', 'hat', 'nitpick', 'bet', 'bowels', 'addc', 'moloch', 'coveredAlready2',
];

export const gridSectionC = [
  'heart', 'goodpoint',  'offtopic',   'typo', 'scholarship', 'why', 'beautiful', 'oops'
];

export const likelihoods = [
  '1percent', '10percent', '25percent', '40percent', '50percent', '60percent', '75percent', '90percent', '99percent',
];

export const getAllCuratedReactionNames = (): string[] => {
  return uniq([
    ...listPrimary,
    ...listEmotions,
    ...listViewSectionB,
    ...listViewSectionC,
    ...listViewSectionD,
    ...gridPrimary,
    ...gridEmotions,
    ...gridSectionB,
    ...gridSectionC,
    ...likelihoods
  ]);
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
