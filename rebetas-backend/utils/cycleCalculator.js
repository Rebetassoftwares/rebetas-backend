function calculateCycles(league, scheduledFor) {
  if (!Array.isArray(league.cycleConfig) || league.cycleConfig.length === 0) {
    return [];
  }

  const firstTime = new Date(league.firstPredictionTime);
  const currentTime = new Date(scheduledFor);

  // 🔥 SUPPORT MINUTES + SECONDS
  const intervalMinutes = Number(league.intervalMinutes || 0);
  const intervalSeconds = Number(league.intervalSeconds || 0);

  const intervalMs = intervalMinutes * 60 * 1000 + intervalSeconds * 1000;

  if (!intervalMs || intervalMs <= 0) return [];

  const steps = Math.floor((currentTime - firstTime) / intervalMs);

  // 🔥 CLONE CONFIG (USE CURRENT IF AVAILABLE)
  const result = league.cycleConfig.map((c) => {
    const start = Number(c.start || 0);

    const initial =
      c.current !== undefined && c.current !== null ? Number(c.current) : start;

    return {
      name: c.name,
      value: initial, // ✅ USE CURRENT
      max: c.max ? Number(c.max) : null,
      start, // keep for reset reference
    };
  });

  for (let i = 0; i < steps; i++) {
    for (let j = result.length - 1; j >= 0; j--) {
      const current = result[j];

      current.value += 1;

      // no max → no rollover
      if (!current.max) break;

      // still within range
      if (current.value <= current.max) break;

      // 🔥 overflow → reset to START (not always 1)
      current.value = current.start || 1;

      // continue to parent cycle
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
