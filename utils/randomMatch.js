function randomMatch(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * matches.length);

  return matches[randomIndex];
}

module.exports = randomMatch;
