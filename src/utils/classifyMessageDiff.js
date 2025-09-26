/**
 * classifyMessageDiff
 * Determine prepend / append changes between two ordered (oldest->newest) message lists
 * @param {Array<{id:string}>} prevMessages
 * @param {Array<{id:string}>} nextMessages
 * @returns {{ didPrepend: boolean, prependedCount: number, didAppend: boolean, appendedCount: number, reset:boolean, prevLength:number, nextLength:number }}
 */
export function classifyMessageDiff(prevMessages, nextMessages) {
  const prevLength = prevMessages.length;
  const nextLength = nextMessages.length;
  if (nextLength === 0 && prevLength === 0) {
    return { didPrepend: false, prependedCount: 0, didAppend: false, appendedCount: 0, reset: false, prevLength, nextLength };
  }
  // Build quick id maps
  const prevIds = prevMessages.map(m => m.id);
  const nextIds = nextMessages.map(m => m.id);
  const prevFirst = prevIds[0];
  const prevLast = prevIds[prevIds.length - 1];
  // We only need previous boundary membership to detect reset and compute prepend/append counts.
  // nextFirst/nextLast variables were unused and removed to satisfy linting.

  // Detect wholesale reset (no overlap)
  const hasPrevLastInNext = nextIds.includes(prevLast);
  const hasPrevFirstInNext = nextIds.includes(prevFirst);
  const reset = prevLength > 0 && !hasPrevLastInNext && !hasPrevFirstInNext;
  if (reset) {
    return { didPrepend: false, prependedCount: 0, didAppend: false, appendedCount: 0, reset: true, prevLength, nextLength };
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
    appendedCount = (nextLength - 1) - idxPrevLast;
  }

  const didPrepend = prependedCount > 0;
  const didAppend = appendedCount > 0;

  return { didPrepend, prependedCount, didAppend, appendedCount, reset, prevLength, nextLength };
}

export default classifyMessageDiff;