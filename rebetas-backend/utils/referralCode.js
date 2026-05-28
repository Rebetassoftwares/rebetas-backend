const crypto = require("crypto");

function cleanUsername(username = "") {
  return String(username || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
}

function generateReferralCode(username = "") {
  const prefix = cleanUsername(username) || "REB";

  const randomNumbers = crypto.randomInt(100, 1000);

  return `${prefix}${randomNumbers}`;
}

function buildReferralLink(referralCode) {
  const frontendUrl =
    process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://rebetas.com";

  if (!referralCode) return null;

  return `${frontendUrl}/register?ref=${encodeURIComponent(referralCode)}`;
}

module.exports = {
  generateReferralCode,
  buildReferralLink,
};
