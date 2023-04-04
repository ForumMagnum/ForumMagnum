

// Get relative link to conversation (used only in session)
export const conversationGetLink = (conversation: HasIdType): string => {
  return `/inbox/${conversation._id}`;
};

// Get relative link to conversation of message (conversations are only linked to relatively)
export const messageGetLink = (message: DbMessage): string => {
  return `/inbox/${message.conversationId}`;
};

export function constantTimeCompare({ correctValue, unknownValue }: { correctValue: string, unknownValue: string }) {
  try {
    const correctValueChars = correctValue.split('');
    const unknownValueChars = unknownValue.split('');

    let allCharsEqual = true;

    // Iterate over the array of correct characters, which has a known (constant) length, to mitigate certain timing attacks
    for (const [idx, char] of Object.entries(correctValueChars)) {
      const matchedIndexCharsEqual = char === unknownValueChars[idx];
      allCharsEqual = matchedIndexCharsEqual && allCharsEqual;
    }

    const sameLength = correctValueChars.length === unknownValueChars.length;

    return allCharsEqual && sameLength;
  } catch {
    return false;
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
