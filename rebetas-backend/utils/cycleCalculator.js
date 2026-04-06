function calculateCycles(league, lastCycles = null) {
  if (!Array.isArray(league.cycleConfig) || league.cycleConfig.length === 0) {
    return [];
  }

  // 🔥 FIRST PREDICTION (no history)
  if (!lastCycles) {
    return league.cycleConfig.map((c) => {
      const start = Number(c.start || 1);

      const initial =
        c.current !== undefined && c.current !== null
          ? Number(c.current)
          : start;

      return {
        name: c.name,
        value: initial,
      };
    });
  }

  // 🔥 CLONE LAST VALUES
  const result = league.cycleConfig.map((c, index) => {
    const last = lastCycles[index];

    return {
      name: c.name,
      value: Number(last?.value || c.start || 1),
      max: c.max ? Number(c.max) : null,
      start: Number(c.start || 1),
    };
  });

  // 🔥 INCREMENT (like your previous loop, but ONLY ONCE)
  for (let j = result.length - 1; j >= 0; j--) {
    const current = result[j];

    current.value += 1;

    if (!current.max) break;

    if (current.value <= current.max) break;

    current.value = current.start;

    // continue to parent
  }

  return result.map(({ name, value }) => ({
    name,
    value,
  }));
}

module.exports = {
  calculateCycles,
};
