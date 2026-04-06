function calculateCycles(league) {
  if (!Array.isArray(league.cycleConfig) || league.cycleConfig.length === 0) {
    return [];
  }

  // 🔥 STATE-DRIVEN: no time, no steps, no simulation
  return league.cycleConfig.map((c) => {
    const start = Number(c.start || 0);

    const value =
      c.current !== undefined && c.current !== null ? Number(c.current) : start;

    return {
      name: c.name,
      value,
    };
  });
}

module.exports = {
  calculateCycles,
};
