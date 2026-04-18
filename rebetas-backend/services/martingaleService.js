/**
 * Martingale Service (CLEAN ARCHITECTURE)
 * --------------------------------------
 * - NO memory state (no martingaleState cache)
 * - PURE FUNCTIONS ONLY
 * - All calculations depend on passed capital
 */

function calculateBaseStake(capital, baseStakePercent) {
  const percent = Number(baseStakePercent || 0) / 100;
  return Math.round(Number(capital || 0) * percent);
}

/**
 * Key generator (still useful for grouping/logging)
 */
function getTrackerKey(platform, leagueName) {
  return `${String(platform).toLowerCase()}_${String(leagueName).trim()}`;
}

/**
 * Get stake directly from current capital
 * (no internal memory tracking anymore)
 */
function getStake(capital, baseStakePercent) {
  return calculateBaseStake(capital, baseStakePercent);
}

/**
 * Update stake based on win/loss logic
 *
 * IMPORTANT:
 * - This does NOT store state anymore
 * - It only computes NEXT stake from inputs
 */
function updateStake(capital, win, multiplier, baseStakePercent) {
  // reset stake after win
  if (win) {
    return calculateBaseStake(capital, baseStakePercent);
  }

  const baseStake = calculateBaseStake(capital, baseStakePercent);
  const nextStake = baseStake * Number(multiplier || 1);

  return nextStake > capital
    ? calculateBaseStake(capital, baseStakePercent)
    : nextStake;
}

module.exports = {
  calculateBaseStake,
  getTrackerKey,
  getStake,
  updateStake,
};
