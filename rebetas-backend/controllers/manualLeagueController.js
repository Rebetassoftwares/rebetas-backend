const ManualLeague = require("../models/ManualLeague");

function sanitizeTeams(teams) {
  if (!Array.isArray(teams)) return [];

  return teams
    .filter((team) => team && typeof team.name === "string" && team.name.trim())
    .map((team) => ({
      name: team.name.trim(),
      shortName:
        typeof team.shortName === "string" ? team.shortName.trim() : "",
    }));
}

function sanitizeCycleConfig(cycleConfig) {
  if (!Array.isArray(cycleConfig)) return [];

  return cycleConfig.map((c) => ({
    name: c.name,
    start: Number(c.start),
    max: c.max !== undefined && c.max !== null ? Number(c.max) : undefined,
  }));
}

function validateLeaguePayload(payload, isUpdate = false) {
  const errors = [];

  const {
    platform,
    leagueName,
    mode,
    totalMatches,
    intervalMinutes,
    firstPredictionTime,
    teams,
    oddRange,
    cycleConfig,
    platformId,
    logo,
  } = payload;

  if (!isUpdate || platform !== undefined) {
    if (!platform || typeof platform !== "string" || !platform.trim()) {
      errors.push("platform is required");
    }
  }

  // ✅ FIXED (allow ObjectId OR string)
  if (!isUpdate || platformId !== undefined) {
    if (
      platformId &&
      typeof platformId !== "string" &&
      typeof platformId !== "object"
    ) {
      errors.push("platformId must be a valid id");
    }
  }

  if (!isUpdate || leagueName !== undefined) {
    if (!leagueName || typeof leagueName !== "string" || !leagueName.trim()) {
      errors.push("leagueName is required");
    }
  }

  if (!isUpdate || mode !== undefined) {
    if (!["AUTO", "MANUAL", "SEMI_AUTO"].includes(mode)) {
      errors.push("mode must be AUTO, MANUAL, or SEMI_AUTO");
    }
  }

  if (!isUpdate || totalMatches !== undefined) {
    if (![8, 10].includes(Number(totalMatches))) {
      errors.push("totalMatches must be 8 or 10");
    }
  }

  if (!isUpdate || intervalMinutes !== undefined) {
    if (
      !Number.isFinite(Number(intervalMinutes)) ||
      Number(intervalMinutes) < 1
    ) {
      errors.push("intervalMinutes must be a number greater than 0");
    }
  }

  if (!isUpdate || firstPredictionTime !== undefined) {
    const date = new Date(firstPredictionTime);
    if (Number.isNaN(date.getTime())) {
      errors.push("firstPredictionTime must be a valid date");
    }
  }

  if (!isUpdate || teams !== undefined) {
    if (!Array.isArray(teams) || teams.length < 1) {
      errors.push("teams must contain at least one team");
    }
  }

  if (!isUpdate || logo !== undefined) {
    if (logo && typeof logo !== "string") {
      errors.push("logo must be a string");
    }
  }

  if (!isUpdate || cycleConfig !== undefined) {
    if (!Array.isArray(cycleConfig) || cycleConfig.length < 1) {
      errors.push("cycleConfig must contain at least one cycle");
    } else {
      cycleConfig.forEach((c, index) => {
        if (!c.name || typeof c.name !== "string") {
          errors.push(`cycleConfig[${index}].name is required`);
        }

        if (!Number.isFinite(Number(c.start))) {
          errors.push(`cycleConfig[${index}].start must be a number`);
        }

        if (c.max !== undefined && c.max !== null) {
          if (!Number.isFinite(Number(c.max))) {
            errors.push(`cycleConfig[${index}].max must be a number`);
          }

          if (Number(c.max) < 1) {
            errors.push(`cycleConfig[${index}].max must be greater than 0`);
          }
        }
      });
    }
  }

  const effectiveMode = mode;

  if (effectiveMode === "SEMI_AUTO") {
    if (
      !oddRange ||
      !Number.isFinite(Number(oddRange.min)) ||
      !Number.isFinite(Number(oddRange.max))
    ) {
      errors.push("oddRange.min and oddRange.max are required for SEMI_AUTO");
    } else {
      const min = Number(oddRange.min);
      const max = Number(oddRange.max);

      if (min <= 0 || max <= 0) {
        errors.push("oddRange values must be greater than 0");
      }

      if (min >= max) {
        errors.push("oddRange.min must be less than oddRange.max");
      }
    }
  }

  return errors;
}

exports.createLeague = async (req, res) => {
  try {
    // ✅ handle multipart/form-data values coming as strings
    if (typeof req.body.teams === "string") {
      req.body.teams = JSON.parse(req.body.teams);
    }

    if (typeof req.body.cycleConfig === "string") {
      req.body.cycleConfig = JSON.parse(req.body.cycleConfig);
    }

    if (typeof req.body.oddRange === "string") {
      req.body.oddRange = JSON.parse(req.body.oddRange);
    }

    // ✅ normalize boolean from FormData
    if (typeof req.body.isActive === "string") {
      req.body.isActive = req.body.isActive === "true";
    }

    const errors = validateLeaguePayload(req.body, false);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const {
      platform,
      platformId,
      leagueName,
      mode,
      totalMatches,
      intervalMinutes,
      firstPredictionTime,
      teams,
      oddRange,
      cycleConfig,
      logo: bodyLogo,
      isActive,
    } = req.body;

    const logo = req.file ? req.file.path : bodyLogo;

    const league = await ManualLeague.create({
      platform: platform.trim(),
      platformId: typeof platformId === "object" ? platformId._id : platformId,
      leagueName: leagueName.trim(),
      logo,
      mode,
      totalMatches: Number(totalMatches),
      intervalMinutes: Number(intervalMinutes),
      firstPredictionTime: new Date(firstPredictionTime),
      teams: sanitizeTeams(teams),

      oddRange:
        mode === "SEMI_AUTO"
          ? {
              min: Number(oddRange.min),
              max: Number(oddRange.max),
            }
          : undefined,

      cycleConfig: sanitizeCycleConfig(cycleConfig),

      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json(league);
  } catch (err) {
    console.error("Create league error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "This platform and league already exist",
      });
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({
        message: "Invalid teams, cycleConfig, or oddRange format",
      });
    }

    res.status(500).json({ message: "Failed to create league" });
  }
};

exports.getLeagues = async (req, res) => {
  try {
    const { platformId } = req.query;

    const filter = {};

    if (platformId) {
      filter.platformId = platformId;
    }

    const leagues = await ManualLeague.find(filter)
      .populate("platformId", "name country logo")
      .sort({ platform: 1, leagueName: 1 });

    res.json(leagues);
  } catch (err) {
    console.error("Fetch leagues error:", err);
    res.status(500).json({ message: "Failed to fetch leagues" });
  }
};

exports.getLeagueById = async (req, res) => {
  try {
    const league = await ManualLeague.findById(req.params.id).populate(
      "platformId",
      "name country logo",
    );

    if (!league) {
      return res.status(404).json({ message: "League not found" });
    }

    res.json(league);
  } catch (err) {
    console.error("Get league error:", err);
    res.status(500).json({ message: "Failed to fetch league" });
  }
};

exports.updateLeague = async (req, res) => {
  try {
    const existing = await ManualLeague.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "League not found" });
    }

    // ✅ handle multipart/form-data values coming as strings
    if (typeof req.body.teams === "string") {
      req.body.teams = JSON.parse(req.body.teams);
    }

    if (typeof req.body.cycleConfig === "string") {
      req.body.cycleConfig = JSON.parse(req.body.cycleConfig);
    }

    if (typeof req.body.oddRange === "string") {
      req.body.oddRange = JSON.parse(req.body.oddRange);
    }

    // ✅ normalize boolean from FormData
    if (typeof req.body.isActive === "string") {
      req.body.isActive = req.body.isActive === "true";
    }

    const merged = {
      platform: req.body.platform ?? existing.platform,
      platformId: req.body.platformId ?? existing.platformId,
      leagueName: req.body.leagueName ?? existing.leagueName,
      logo: req.file ? req.file.path : (req.body.logo ?? existing.logo),

      mode: req.body.mode ?? existing.mode,
      totalMatches: req.body.totalMatches ?? existing.totalMatches,
      intervalMinutes: req.body.intervalMinutes ?? existing.intervalMinutes,
      firstPredictionTime:
        req.body.firstPredictionTime ?? existing.firstPredictionTime,
      teams: req.body.teams ?? existing.teams,
      oddRange: req.body.oddRange ?? existing.oddRange,
      cycleConfig: req.body.cycleConfig ?? existing.cycleConfig,
      isActive: req.body.isActive ?? existing.isActive,
    };

    // ✅ FIXED HERE
    const errors = validateLeaguePayload(merged, true);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    existing.platform = String(merged.platform).trim();
    existing.platformId =
      typeof merged.platformId === "object"
        ? merged.platformId._id
        : merged.platformId;
    existing.leagueName = String(merged.leagueName).trim();
    existing.logo = merged.logo;
    existing.mode = merged.mode;
    existing.totalMatches = Number(merged.totalMatches);
    existing.intervalMinutes = Number(merged.intervalMinutes);
    existing.firstPredictionTime = new Date(merged.firstPredictionTime);
    existing.teams = sanitizeTeams(merged.teams);
    existing.isActive = Boolean(merged.isActive);

    if (merged.mode === "SEMI_AUTO") {
      existing.oddRange = {
        min: Number(merged.oddRange.min),
        max: Number(merged.oddRange.max),
      };
    } else {
      existing.oddRange = undefined;
    }

    existing.cycleConfig = sanitizeCycleConfig(merged.cycleConfig);

    await existing.save();

    res.json(existing);
  } catch (err) {
    console.error("Update league error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "This platform and league already exist",
      });
    }

    res.status(500).json({ message: "Failed to update league" });
  }
};
