const SystemState = require("../models/SystemState");

const {
  getActivitySnapshot,
  generateActivitySnapshot,
} = require("../services/activityCounterService");

/*
  ADMIN: GET ACTIVITY SETTINGS
*/
exports.getActivitySettings = async (req, res) => {
  try {
    const state = await SystemState.findOne({ key: "main" }).select(
      "activityMin activityMax",
    );

    if (!state) {
      return res.status(404).json({
        message: "System state not found",
      });
    }

    res.json({
      activityMin: state.activityMin,
      activityMax: state.activityMax,
    });
  } catch (error) {
    console.error("Get activity settings error:", error);

    res.status(500).json({
      message: "Failed to fetch activity settings",
    });
  }
};

/*
  ADMIN: UPDATE ACTIVITY SETTINGS
*/
exports.updateActivitySettings = async (req, res) => {
  try {
    const { activityMin, activityMax } = req.body;

    const min = Number(activityMin);
    const max = Number(activityMax);

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < min ||
      max > 1000000
    ) {
      return res.status(400).json({
        message:
          "Enter valid whole numbers. Minimum must be zero or greater, maximum must be at least the minimum, and maximum cannot exceed 1,000,000.",
      });
    }

    const state = await SystemState.findOneAndUpdate(
      { key: "main" },
      {
        $set: {
          activityMin: min,
          activityMax: max,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!state) {
      return res.status(404).json({
        message: "System state not found",
      });
    }

    const snapshot = await generateActivitySnapshot();

    res.json({
      message: "Activity settings updated successfully",
      activityMin: state.activityMin,
      activityMax: state.activityMax,
      snapshot,
    });
  } catch (error) {
    console.error("Update activity settings error:", error);

    res.status(500).json({
      message: "Failed to update activity settings",
    });
  }
};

/*
  PUBLIC: GET GENERATED ACTIVITY
*/
exports.getPublicActivity = async (req, res) => {
  try {
    const snapshot = await getActivitySnapshot();

    res.set("Cache-Control", "no-store");

    res.json(snapshot);
  } catch (error) {
    console.error("Get public activity error:", error);

    res.status(500).json({
      message: "Failed to fetch activity figures",
    });
  }
};
