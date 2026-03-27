function calculateCycles(league, scheduledFor) {
  if (!Array.isArray(league.cycleConfig) || league.cycleConfig.length === 0) {
    return [];
  }

  const firstTime = new Date(league.firstPredictionTime);
  const currentTime = new Date(scheduledFor);

  const intervalMs = Number(league.intervalMinutes) * 60 * 1000;

  if (!intervalMs || intervalMs <= 0) return [];

  const steps = Math.floor((currentTime - firstTime) / intervalMs);

  // clone config
  const result = league.cycleConfig.map((c) => ({
    name: c.name,
    value: Number(c.start),
    max: c.max ? Number(c.max) : null,
  }));

  for (let i = 0; i < steps; i++) {
    for (let j = result.length - 1; j >= 0; j--) {
      const current = result[j];

      current.value += 1;

      // no max → no rollover
      if (!current.max) break;

      // still within range
      if (current.value <= current.max) break;

      // overflow → reset
      current.value = 1;
      // continue to parent
    }
  }

  return result.map(({ name, value }) => ({
    name,
    value,
  }));
}

module.exports = {
  calculateCycles,
};
