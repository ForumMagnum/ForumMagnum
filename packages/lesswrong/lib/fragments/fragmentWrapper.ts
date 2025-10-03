import { DocumentNode, print } from 'graphql';

interface FragmentInfo {
  fragmentName: string
  fragmentText: string
}

// Get a fragment's name from its text
export function extractFragmentName(fragmentText: string): FragmentName {
  const match = fragmentText.match(/fragment (.*) on/)
  if (!match) throw new Error("Could not extract fragment name");
  return match[1] as FragmentName;
}

export function transformFragments<T extends Record<string, DocumentNode>>(fragments: T): Record<keyof T, string> {
  return Object.fromEntries(
    Object.entries(fragments).map(([key, value]) => {
      try {
        const result = [key, print(value)];
        return result;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error printing fragment ${key}:`, e);
        return [key, value];
      }
    })
  )
}

export function frag(strings: TemplateStringsArray, ...values: (string|FragmentInfo|(() => FragmentInfo))[]): FragmentInfo {
  const sb: string[] = [];
  
  for (let i=0; i<strings.length; i++) {
    sb.push(strings[i]);
    if (i < values.length) {
      const val = values[i];
      if (typeof val === 'string') {
        sb.push('...'+val);
      } else if (typeof val === 'function') {
        sb.push('...'+val().fragmentName);
      } else {
        sb.push('...'+val.fragmentName);
      }
    }
  }
  
  const fragmentText = sb.join('');
  return {
    fragmentName: extractFragmentName(fragmentText),
    fragmentText,
  };
}
