const SystemState = require("../models/SystemState");
const Platform = require("../models/Platform");
const ManualLeague = require("../models/ManualLeague");

const UPDATE_INTERVAL = 5 * 1000;

let activityTimer = null;

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/*
  Distributes an integer total across entities.

  Explicit weights take priority.
  Entities without explicit weights use historical
  values to preserve gradual distribution changes.
*/
function distribute(total, entities, previousValues = {}) {
  const result = {};

  if (!entities.length) {
    return result;
  }

  if (total <= 0) {
    entities.forEach((entity) => {
      result[entity.id] = 0;
    });

    return result;
  }

  const weights = entities.map((entity) => {
    if (Number.isFinite(entity.weight) && entity.weight > 0) {
      return entity.weight;
    }

    const previous = previousValues[entity.id];

    if (Number.isFinite(previous)) {
      return Math.max(1, previous + randomInteger(-1, 1));
    }

    return randomInteger(8, 12);
  });

  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  const allocations = entities.map((entity, index) => {
    const exactShare = (total * weights[index]) / weightTotal;

    return {
      id: entity.id,
      value: Math.floor(exactShare),
      remainder: exactShare - Math.floor(exactShare),
    };
  });

  let remaining =
    total - allocations.reduce((sum, item) => sum + item.value, 0);

  // Distribute remaining units according to largest fractional remainders.
  allocations.sort((a, b) => b.remainder - a.remainder);

  for (let index = 0; index < remaining; index += 1) {
    allocations[index % allocations.length].value += 1;
  }

  allocations.forEach((item) => {
    result[item.id] = item.value;
  });

  return result;
}

/*
  Generates the next website-wide activity total.
*/
function getNextTotal(previousTotal, min, max) {
  if (min === max) {
    return min;
  }

  if (!Number.isFinite(previousTotal)) {
    return randomInteger(min, max);
  }

  const movement = randomInteger(1, 3);
  const direction = Math.random() < 0.5 ? -1 : 1;

  let next = previousTotal + movement * direction;

  if (next < min) {
    next = previousTotal + movement;
  }

  if (next > max) {
    next = previousTotal - movement;
  }

  return clamp(next, min, max);
}

/*
  NORMALIZE PLATFORM NAMES

  Supports the actual database spelling PERIPESA
  and common spelling variations.
*/
function normalizePlatformName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isPeripessa(platformName) {
  const name = normalizePlatformName(platformName);

  return ["peripesa", "peripessa", "paripesa"].includes(name);
}

function isOneXBet(platformName) {
  return normalizePlatformName(platformName) === "1xbet";
}

/*
  PLATFORM PRIORITY ALLOCATION

  PERIPESA: weight 1 (lowest).
  1xBet: weight 2 (second-lowest).

  All remaining platforms receive unique weights:
  3, 4, 5, 6, 7, etc.

  Their weights are assigned in alphabetical order
  so their allocations remain stable between snapshots.
*/
function getPlatformEntities(platforms) {
  const otherPlatforms = platforms
    .filter(
      (platform) => !isPeripessa(platform.name) && !isOneXBet(platform.name),
    )
    .sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name);

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return String(a._id).localeCompare(String(b._id));
    });

  const otherPlatformWeights = new Map();

  otherPlatforms.forEach((platform, index) => {
    otherPlatformWeights.set(String(platform._id), index + 3);
  });

  return platforms.map((platform) => {
    let weight;

    if (isPeripessa(platform.name)) {
      weight = 1;
    } else if (isOneXBet(platform.name)) {
      weight = 2;
    } else {
      weight = otherPlatformWeights.get(String(platform._id));
    }

    return {
      id: String(platform._id),
      weight,
    };
  });
}

/*
  GENERATE ACTIVITY SNAPSHOT
*/
async function generateActivitySnapshot() {
  const state = await SystemState.findOne({ key: "main" });

  if (!state) {
    throw new Error("System state not initialized");
  }

  const min = Number(state.activityMin ?? 100);
  const max = Number(state.activityMax ?? 250);

  const platforms = await Platform.find({
    isActive: true,
  })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  const platformIds = platforms.map((platform) => platform._id);

  const leagues = await ManualLeague.find({
    isActive: true,
    platformId: { $in: platformIds },
  })
    .select("_id platformId leagueName")
    .sort({ leagueName: 1 })
    .lean();

  const leaguesByPlatform = {};

  leagues.forEach((league) => {
    const platformId = String(league.platformId);

    if (!leaguesByPlatform[platformId]) {
      leaguesByPlatform[platformId] = [];
    }

    leaguesByPlatform[platformId].push(league);
  });

  // Only platforms with active leagues receive an allocation.
  const eligiblePlatforms = platforms.filter(
    (platform) => (leaguesByPlatform[String(platform._id)] || []).length > 0,
  );

  if (!eligiblePlatforms.length) {
    const emptySnapshot = {
      total: 0,
      platforms: [],
      updatedAt: new Date(),
    };

    await SystemState.updateOne(
      { key: "main" },
      {
        $set: {
          activitySnapshot: emptySnapshot,
          activitySnapshotUpdatedAt: emptySnapshot.updatedAt,
        },
      },
    );

    return emptySnapshot;
  }

  const previousSnapshot = state.activitySnapshot || {};

  const previousTotal = Number(previousSnapshot.total);

  const total = clamp(getNextTotal(previousTotal, min, max), min, max);

  /*
    PLATFORM ALLOCATION

    PERIPESA receives weight 1.
    1xBet receives weight 2.
    Other platforms receive unique weights starting from 3.

    This prevents all other platforms from receiving
    identical allocations simply because they share weight 3.
  */
  const platformEntities = getPlatformEntities(eligiblePlatforms);

  const platformAllocations = distribute(total, platformEntities);

  /*
    LEAGUE ALLOCATION

    Each platform's allocation is distributed among
    its active leagues using historical weighting.
  */
  const platformResults = eligiblePlatforms.map((platform) => {
    const platformId = String(platform._id);

    const platformCount = platformAllocations[platformId] || 0;

    const platformLeagues = leaguesByPlatform[platformId] || [];

    const previousLeagueValues = {};

    const previousPlatform = (previousSnapshot.platforms || []).find(
      (item) => String(item.platformId) === platformId,
    );

    (previousPlatform?.leagues || []).forEach((league) => {
      previousLeagueValues[String(league.leagueId)] = league.count;
    });

    const leagueEntities = platformLeagues.map((league) => ({
      id: String(league._id),
    }));

    const leagueAllocations = distribute(
      platformCount,
      leagueEntities,
      previousLeagueValues,
    );

    return {
      platformId,
      platformName: platform.name,
      count: platformCount,

      leagues: platformLeagues.map((league) => ({
        leagueId: String(league._id),
        leagueName: league.leagueName,
        count: leagueAllocations[String(league._id)] || 0,
      })),
    };
  });

  const snapshot = {
    total,
    platforms: platformResults,
    updatedAt: new Date(),
  };

  await SystemState.updateOne(
    { key: "main" },
    {
      $set: {
        activitySnapshot: snapshot,
        activitySnapshotUpdatedAt: snapshot.updatedAt,
      },
    },
  );

  return snapshot;
}

/*
  GET CURRENT ACTIVITY SNAPSHOT
*/
async function getActivitySnapshot() {
  const state = await SystemState.findOne({ key: "main" }).lean();

  if (state?.activitySnapshot) {
    return state.activitySnapshot;
  }

  return generateActivitySnapshot();
}

/*
  START AUTOMATIC SNAPSHOT GENERATION
*/
function startActivityCounter() {
  if (activityTimer) {
    return;
  }

  generateActivitySnapshot().catch((error) => {
    console.error("Initial activity snapshot error:", error.message);
  });

  activityTimer = setInterval(() => {
    generateActivitySnapshot().catch((error) => {
      console.error("Activity snapshot update error:", error.message);
    });
  }, UPDATE_INTERVAL);

  console.log("Programmed activity counter started");
}

module.exports = {
  generateActivitySnapshot,
  getActivitySnapshot,
  startActivityCounter,
};
