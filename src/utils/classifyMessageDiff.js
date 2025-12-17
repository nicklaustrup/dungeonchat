/**
 * classifyMessageDiff
 * Determine prepend / append changes between two ordered (oldest->newest) message lists
 * @param {Array<{id:string}>} prevMessages
 * @param {Array<{id:string}>} nextMessages
 * @returns {{ didPrepend: boolean, prependedCount: number, didAppend: boolean, appendedCount: number, reset:boolean, prevLength:number, nextLength:number }}
 */
export function classifyMessageDiff(prevMessages, nextMessages) {
  // Handle undefined/null cases to prevent length errors
  if (!prevMessages || !nextMessages) {
    return {
      didPrepend: false,
      prependedCount: 0,
      didAppend: false,
      appendedCount: 0,
      reset: false,
      prevLength: 0,
      nextLength: 0,
    };
  }

  const prevLength = prevMessages.length;
  const nextLength = nextMessages.length;
  if (nextLength === 0 && prevLength === 0) {
    return {
      didPrepend: false,
      prependedCount: 0,
      didAppend: false,
      appendedCount: 0,
      reset: false,
      prevLength,
      nextLength,
    };
  }
  // Build quick id maps - filter out null/invalid messages
  const prevIds = prevMessages.filter((m) => m && m.id).map((m) => m.id);
  const nextIds = nextMessages.filter((m) => m && m.id).map((m) => m.id);
  const prevFirst = prevIds[0];
  const prevLast = prevIds[prevIds.length - 1];
  // We only need previous boundary membership to detect reset and compute prepend/append counts.
  // nextFirst/nextLast variables were unused and removed to satisfy linting.

  // Detect wholesale reset (no overlap)
  const hasPrevLastInNext = nextIds.includes(prevLast);
  const hasPrevFirstInNext = nextIds.includes(prevFirst);
  const reset = prevLength > 0 && !hasPrevLastInNext && !hasPrevFirstInNext;
  if (reset) {
    return {
      didPrepend: false,
      prependedCount: 0,
      didAppend: false,
      appendedCount: 0,
      reset: true,
      prevLength,
      nextLength,
    };
  }

  let prependedCount = 0;
  if (hasPrevFirstInNext) {
    const idxPrevFirst = nextIds.indexOf(prevFirst);
    prependedCount = idxPrevFirst; // number of new older messages
  } else if (prevLength === 0 && nextLength > 0) {
    prependedCount = 0; // initial hydrate not considered prepend
  }

  let appendedCount = 0;
  if (hasPrevLastInNext) {
    const idxPrevLast = nextIds.indexOf(prevLast);
    appendedCount = nextLength - 1 - idxPrevLast;
  }

  let didPrepend = prependedCount > 0;
  let didAppend = appendedCount > 0;

  // Heuristic correction: False-positive single-item prepend when only the last item changed.
  // Scenario: backend reorders or we briefly miss the old first id; classification shows prependedCount=1, appendedCount=0
  // but the previous last id shifted inward by exactly one and list length grew by 1 (true append). We can detect by:
  //  - net growth of 1 (nextLength === prevLength + 1)
  //  - previous last id still present (already guaranteed by hasPrevLastInNext)
  //  - index of previous last id == nextLength - 2 (it moved down exactly one slot)
  //  - prependedCount === 1 and appendedCount === 0
  if (
    !didAppend &&
    didPrepend &&
    prependedCount === 1 &&
    nextLength === prevLength + 1 &&
    hasPrevLastInNext
  ) {
    const idxPrevLastInNext = nextIds.indexOf(prevLast);
    if (idxPrevLastInNext === nextLength - 2) {
      // Reclassify as a pure append of 1
      didPrepend = false;
      prependedCount = 0;
      didAppend = true;
      appendedCount = 1;
    }
  }

  return {
    didPrepend,
    prependedCount,
    didAppend,
    appendedCount,
    reset,
    prevLength,
    nextLength,
  };
}

export default classifyMessageDiff;
