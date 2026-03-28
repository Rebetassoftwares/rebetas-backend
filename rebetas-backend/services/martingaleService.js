const martingaleState = {};

function calculateBaseStake(capital, baseStakePercent) {
  const percent = Number(baseStakePercent || 0) / 100;
  return Math.round(Number(capital || 0) * percent);
}

function getTrackerKey(platform, leagueName) {
  return `${String(platform).toLowerCase()}_${String(leagueName).trim()}`;
}

function getStake(key, systemState) {
  if (!martingaleState[key]) {
    martingaleState[key] = calculateBaseStake(
      systemState.capital,
      systemState.baseStakePercent,
    );
  }

  return martingaleState[key];
}

function updateStake(key, win, systemState) {
  if (!martingaleState[key]) {
    martingaleState[key] = calculateBaseStake(
      systemState.capital,
      systemState.baseStakePercent,
    );
  }

  if (win) {
    martingaleState[key] = calculateBaseStake(
      systemState.capital,
      systemState.baseStakePercent,
    );
    return martingaleState[key];
  }

  const nextStake = martingaleState[key] * Number(systemState.multiplier || 1);

  martingaleState[key] =
    nextStake > systemState.capital
      ? calculateBaseStake(systemState.capital, systemState.baseStakePercent)
      : nextStake;

  return martingaleState[key];
}

module.exports = {
  calculateBaseStake,
  getTrackerKey,
  getStake,
  updateStake,
};
