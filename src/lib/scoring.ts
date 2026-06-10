// Regulile grupului: scor exact = 3 puncte, doar rezultatul corect (1/X/2) = 1 punct.
// Punctajul se calculează pe scorul final înregistrat în aplicație (cel de la API
// sau cel introdus de admin).
export const POINTS_EXACT = 3;
export const POINTS_OUTCOME = 1;

function outcome(home: number, away: number): -1 | 0 | 1 {
  if (home === away) return 0;
  return home > away ? 1 : -1;
}

export function points(
  predHome: number,
  predAway: number,
  resultHome: number,
  resultAway: number
): number {
  if (predHome === resultHome && predAway === resultAway) return POINTS_EXACT;
  if (outcome(predHome, predAway) === outcome(resultHome, resultAway)) return POINTS_OUTCOME;
  return 0;
}
