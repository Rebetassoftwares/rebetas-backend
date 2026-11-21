const WebsiteEvent = require("../models/WebsiteEvent");
const WebsiteVisitor = require("../models/WebsiteVisitor");
const WebsiteSession = require("../models/WebsiteSession");

const getDateRange = (query) => {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    return null;
  }

  return { startDate, endDate };
};

const getWebsiteAnalytics = async (req, res) => {
  try {
    const range = getDateRange(req.query);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    const { startDate, endDate } = range;

    const eventMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const visitorMatch = {
      firstSeenAt: { $gte: startDate, $lte: endDate },
    };

    const sessionMatch = {
      startedAt: { $gte: startDate, $lte: endDate },
    };

    const [
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      activeVisitors,
      eventCounts,
      trafficSources,
      topPages,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      dailyTraffic,
      recentActivity,
      tutorialStats,
      conversionStats,
      sessions,
    ] = await Promise.all([
      WebsiteEvent.countDocuments({
        ...eventMatch,
        eventName: "PageView",
      }),

      WebsiteVisitor.countDocuments(visitorMatch),

      WebsiteSession.countDocuments(sessionMatch),

      WebsiteSession.countDocuments({
        isActive: true,
        lastActivityAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      }),

      WebsiteEvent.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: "$eventName",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      WebsiteEvent.aggregate([
        {
          $match: {
            ...eventMatch,
            eventName: "PageView",
          },
        },
        {
          $group: {
            _id: {
              source: { $ifNull: ["$source", "direct"] },
              medium: { $ifNull: ["$medium", "none"] },
            },
            visitors: { $addToSet: "$visitorId" },
            pageViews: { $sum: 1 },
          },
        },
        {
          $project: {
            source: "$_id.source",
            medium: "$_id.medium",
            visitors: { $size: "$visitors" },
            pageViews: 1,
          },
        },
        { $sort: { visitors: -1 } },
      ]),

      WebsiteEvent.aggregate([
        {
          $match: {
            ...eventMatch,
            eventName: "PageView",
          },
        },
        {
          $group: {
            _id: "$pagePath",
            pageViews: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        {
          $project: {
            page: "$_id",
            pageViews: 1,
            uniqueVisitors: { $size: "$visitors" },
          },
        },
        { $sort: { pageViews: -1 } },
        { $limit: 15 },
      ]),

      WebsiteEvent.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: "$deviceType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      WebsiteEvent.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: "$browser",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      WebsiteEvent.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: "$country",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      WebsiteEvent.aggregate([
        {
          $match: {
            ...eventMatch,
            eventName: "PageView",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            pageViews: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        {
          $project: {
            date: "$_id",
            pageViews: 1,
            uniqueVisitors: { $size: "$visitors" },
          },
        },
        { $sort: { date: 1 } },
      ]),

      WebsiteEvent.find(eventMatch)
        .sort({ createdAt: -1 })
        .limit(30)
        .select(
          "eventName visitorId sessionId pagePath source medium campaign country deviceType createdAt eventData",
        )
        .lean(),

      WebsiteEvent.aggregate([
        {
          $match: {
            ...eventMatch,
            eventName: {
              $in: ["TutorialStart", "TutorialProgress", "TutorialComplete"],
            },
          },
        },
        {
          $group: {
            _id: "$eventName",
            count: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        {
          $project: {
            event: "$_id",
            count: 1,
            uniqueVisitors: { $size: "$visitors" },
          },
        },
      ]),

      WebsiteEvent.aggregate([
        {
          $match: {
            ...eventMatch,
            eventName: {
              $in: [
                "RegistrationAttempt",
                "CompleteRegistration",
                "Login",
                "InitiateCheckout",
                "Subscribe",
                "Purchase",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$eventName",
            count: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        {
          $project: {
            event: "$_id",
            count: 1,
            uniqueVisitors: { $size: "$visitors" },
          },
        },
      ]),

      WebsiteSession.find(sessionMatch)
        .sort({ startedAt: -1 })
        .limit(500)
        .select(
          "visitorId startedAt lastActivityAt durationSeconds pageViews landingPage attribution country deviceType browser isActive",
        )
        .lean(),
    ]);

    const eventMap = Object.fromEntries(
      eventCounts.map((item) => [item._id, item.count]),
    );

    const tutorialMap = Object.fromEntries(
      tutorialStats.map((item) => [item.event, item.count]),
    );

    const conversionMap = Object.fromEntries(
      conversionStats.map((item) => [item.event, item.count]),
    );

    const totalRevenue = 0;

    return res.status(200).json({
      success: true,
      dateRange: {
        startDate,
        endDate,
      },

      overview: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        activeVisitors,
        averagePagesPerSession:
          totalSessions > 0
            ? Number((totalPageViews / totalSessions).toFixed(2))
            : 0,
        totalRevenue,
      },

      events: eventMap,

      trafficSources,

      topPages,

      devices: deviceBreakdown,

      browsers: browserBreakdown,

      countries: countryBreakdown,

      dailyTraffic,

      tutorials: {
        starts: tutorialMap.TutorialStart || 0,
        progress: tutorialMap.TutorialProgress || 0,
        completions: tutorialMap.TutorialComplete || 0,
      },

      conversions: {
        registrationAttempts: conversionMap.RegistrationAttempt || 0,
        registrations: conversionMap.CompleteRegistration || 0,
        logins: conversionMap.Login || 0,
        checkoutInitiations: conversionMap.InitiateCheckout || 0,
        subscriptions: conversionMap.Subscribe || 0,
        purchases: conversionMap.Purchase || 0,
      },

      recentActivity,

      sessions,
    });
  } catch (error) {
    console.error("Website analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve website analytics.",
    });
  }
};

module.exports = {
  getWebsiteAnalytics,
};
