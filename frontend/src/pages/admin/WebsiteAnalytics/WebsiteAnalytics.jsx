import { useCallback, useEffect, useMemo, useState } from "react";
import { getWebsiteAnalytics } from "../../../services/adminApi";
import "./WebsiteAnalytics.css";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;

  if (minutes === 0) return `${remainingSeconds}s`;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const formatDate = (value, options = {}) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
};

const getDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();

  start.setDate(start.getDate() - 29);

  return {
    startDate: getDateInputValue(start),
    endDate: getDateInputValue(end),
  };
};

function MetricCard({ label, value, detail, icon, accent }) {
  return (
    <div className="wa-metric-card">
      <div className="wa-metric-top">
        <span className="wa-metric-label">{label}</span>
        <span className={`wa-metric-icon ${accent || ""}`}>{icon}</span>
      </div>

      <div className="wa-metric-value">{value}</div>

      {detail && <div className="wa-metric-detail">{detail}</div>}
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="wa-section-header">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ message = "No data available for this period." }) {
  return <div className="wa-empty-state">{message}</div>;
}

function BreakdownList({ items = [], labelKey = "_id", valueKey = "count" }) {
  const maxValue = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey]) || 0),
  );

  if (!items.length) return <EmptyState />;

  return (
    <div className="wa-breakdown-list">
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const percentage = (value / maxValue) * 100;

        return (
          <div className="wa-breakdown-item" key={`${item[labelKey]}-${index}`}>
            <div className="wa-breakdown-info">
              <span title={item[labelKey] || "Unknown"}>
                {item[labelKey] || "Unknown"}
              </span>
              <strong>{formatNumber(value)}</strong>
            </div>

            <div className="wa-progress-track">
              <div
                className="wa-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyTrafficChart({ data = [] }) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        pageViews: Number(item.pageViews) || 0,
        uniqueVisitors: Number(item.uniqueVisitors) || 0,
      })),
    [data],
  );

  if (!chartData.length) {
    return (
      <EmptyState message="Traffic history will appear here once visits are recorded." />
    );
  }

  const width = 760;
  const height = 230;
  const padding = { top: 15, right: 15, bottom: 35, left: 38 };

  const maxValue = Math.max(
    1,
    ...chartData.map((item) => Math.max(item.pageViews, item.uniqueVisitors)),
  );

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const x = (index) =>
    padding.left +
    (chartData.length === 1
      ? plotWidth / 2
      : (index / (chartData.length - 1)) * plotWidth);

  const y = (value) =>
    padding.top + plotHeight - (value / maxValue) * plotHeight;

  const makePath = (key) =>
    chartData
      .map(
        (item, index) =>
          `${index === 0 ? "M" : "L"} ${x(index)} ${y(item[key])}`,
      )
      .join(" ");

  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((chartData.length - 1) / 3),
      Math.floor(((chartData.length - 1) * 2) / 3),
      chartData.length - 1,
    ]),
  ];

  return (
    <div className="wa-chart-container">
      <div className="wa-chart-legend">
        <span>
          <i className="wa-legend-pageviews" /> Page views
        </span>
        <span>
          <i className="wa-legend-visitors" /> Unique visitors
        </span>
      </div>

      <div className="wa-chart-scroll">
        <svg
          className="wa-traffic-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Daily page views and unique visitors"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const gridY = padding.top + plotHeight * fraction;
            const value = Math.round(maxValue * (1 - fraction));

            return (
              <g key={fraction}>
                <line
                  x1={padding.left}
                  y1={gridY}
                  x2={width - padding.right}
                  y2={gridY}
                  className="wa-chart-gridline"
                />
                <text
                  x={padding.left - 9}
                  y={gridY + 4}
                  textAnchor="end"
                  className="wa-chart-axis-label"
                >
                  {value}
                </text>
              </g>
            );
          })}

          <path d={makePath("pageViews")} className="wa-chart-line-pageviews" />
          <path
            d={makePath("uniqueVisitors")}
            className="wa-chart-line-visitors"
          />

          {chartData.map((item, index) => (
            <g key={item.date}>
              <circle
                cx={x(index)}
                cy={y(item.pageViews)}
                r="3.5"
                className="wa-chart-point-pageviews"
              />
              <circle
                cx={x(index)}
                cy={y(item.uniqueVisitors)}
                r="3.5"
                className="wa-chart-point-visitors"
              />
            </g>
          ))}

          {labelIndexes.map((index) => (
            <text
              key={index}
              x={x(index)}
              y={height - 9}
              textAnchor="middle"
              className="wa-chart-axis-label"
            >
              {formatDate(chartData[index].date, {
                day: "2-digit",
                month: "short",
                year: undefined,
              })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function WebsiteAnalytics() {
  const defaultDates = useMemo(() => getDefaultDates(), []);

  const [dates, setDates] = useState(defaultDates);
  const [appliedDates, setAppliedDates] = useState(defaultDates);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (filters, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await getWebsiteAnalytics(filters);

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load website analytics.",
        );
      }

      setAnalytics(response);
    } catch (err) {
      setError(err.message || "Unable to load website analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(appliedDates);
  }, [appliedDates, loadAnalytics]);

  const applyDateFilter = (event) => {
    event.preventDefault();

    if (!dates.startDate || !dates.endDate || dates.startDate > dates.endDate) {
      setError("Please select a valid date range.");
      return;
    }

    setAppliedDates({ ...dates });
  };

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();

    start.setDate(start.getDate() - (days - 1));

    const next = {
      startDate: getDateInputValue(start),
      endDate: getDateInputValue(end),
    };

    setDates(next);
    setAppliedDates(next);
  };

  const overview = analytics?.overview || {};
  const tutorials = analytics?.tutorials || {};
  const conversions = analytics?.conversions || {};

  const recentActivity = analytics?.recentActivity || [];
  const sessions = analytics?.sessions || [];
  const trafficSources = analytics?.trafficSources || [];
  const topPages = analytics?.topPages || [];
  const devices = analytics?.devices || [];
  const browsers = analytics?.browsers || [];
  const countries = analytics?.countries || [];

  return (
    <div className="wa-page">
      <div className="wa-page-heading">
        <div>
          <div className="wa-eyebrow">WEBSITE PERFORMANCE</div>
          <h1>Website Analytics</h1>
          <p>
            Understand your visitors, acquisition channels and website activity.
          </p>
        </div>

        <button
          type="button"
          className="wa-refresh-button"
          onClick={() => loadAnalytics(appliedDates, true)}
          disabled={loading || refreshing}
        >
          <span className={refreshing ? "wa-spin" : ""}>↻</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <form className="wa-filter-bar" onSubmit={applyDateFilter}>
        <div className="wa-date-fields">
          <label>
            <span>From</span>
            <input
              type="date"
              value={dates.startDate}
              max={dates.endDate || undefined}
              onChange={(event) =>
                setDates((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>To</span>
            <input
              type="date"
              value={dates.endDate}
              min={dates.startDate || undefined}
              max={getDateInputValue(new Date())}
              onChange={(event) =>
                setDates((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
            />
          </label>

          <button type="submit" className="wa-apply-button" disabled={loading}>
            Apply filter
          </button>
        </div>

        <div className="wa-presets">
          <button type="button" onClick={() => setPreset(7)}>
            7 days
          </button>
          <button type="button" onClick={() => setPreset(30)}>
            30 days
          </button>
          <button type="button" onClick={() => setPreset(90)}>
            90 days
          </button>
        </div>
      </form>

      {error && (
        <div className="wa-error">
          <span>{error}</span>
          <button type="button" onClick={() => loadAnalytics(appliedDates)}>
            Try again
          </button>
        </div>
      )}

      {loading && !analytics ? (
        <div className="wa-loading">
          <div className="wa-loader" />
          <p>Loading website analytics...</p>
        </div>
      ) : (
        <>
          <div className="wa-period-caption">
            Reporting period: {formatDate(analytics?.dateRange?.startDate)} –{" "}
            {formatDate(analytics?.dateRange?.endDate)}
          </div>

          <section className="wa-metrics-grid">
            <MetricCard
              label="Page views"
              value={formatNumber(overview.totalPageViews)}
              detail="Total recorded page views"
              icon="◫"
              accent="blue"
            />
            <MetricCard
              label="Unique visitors"
              value={formatNumber(overview.uniqueVisitors)}
              detail="Distinct tracked visitors"
              icon="♙"
              accent="purple"
            />
            <MetricCard
              label="Sessions"
              value={formatNumber(overview.totalSessions)}
              detail="Recorded browsing sessions"
              icon="◷"
              accent="orange"
            />
            <MetricCard
              label="Active visitors"
              value={formatNumber(overview.activeVisitors)}
              detail="Active within the last 5 minutes"
              icon="●"
              accent="green"
            />
            <MetricCard
              label="Pages per session"
              value={Number(overview.averagePagesPerSession || 0).toFixed(2)}
              detail="Average page views per session"
              icon="▤"
              accent="cyan"
            />
          </section>

          <section className="wa-panel">
            <SectionHeader
              title="Traffic overview"
              description="Daily page views compared with unique visitors."
            />
            <DailyTrafficChart data={analytics?.dailyTraffic || []} />
          </section>

          <div className="wa-two-column">
            <section className="wa-panel">
              <SectionHeader
                title="Traffic sources"
                description="Where your visitors came from."
              />

              {trafficSources.length ? (
                <div className="wa-table-wrap">
                  <table className="wa-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Medium</th>
                        <th>Visitors</th>
                        <th>Page views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficSources.map((item, index) => (
                        <tr key={`${item.source}-${item.medium}-${index}`}>
                          <td className="wa-strong">
                            {item.source || "Unknown"}
                          </td>
                          <td>{item.medium || "—"}</td>
                          <td>{formatNumber(item.visitors)}</td>
                          <td>{formatNumber(item.pageViews)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState />
              )}
            </section>

            <section className="wa-panel">
              <SectionHeader
                title="Top pages"
                description="Pages receiving the most views."
              />

              {topPages.length ? (
                <div className="wa-table-wrap">
                  <table className="wa-table">
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Views</th>
                        <th>Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((item, index) => (
                        <tr key={`${item.page}-${index}`}>
                          <td className="wa-page-path" title={item.page}>
                            {item.page || "/"}
                          </td>
                          <td>{formatNumber(item.pageViews)}</td>
                          <td>{formatNumber(item.uniqueVisitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>

          <section className="wa-panel">
            <SectionHeader
              title="Tutorial performance"
              description="Engagement with your tutorial content."
            />

            <div className="wa-conversion-grid wa-tutorial-grid">
              <div className="wa-conversion-card">
                <span>Tutorial starts</span>
                <strong>{formatNumber(tutorials.starts)}</strong>
              </div>
              <div className="wa-conversion-card">
                <span>Tutorial progress events</span>
                <strong>{formatNumber(tutorials.progress)}</strong>
              </div>
              <div className="wa-conversion-card">
                <span>Tutorial completions</span>
                <strong>{formatNumber(tutorials.completions)}</strong>
              </div>
            </div>
          </section>

          <section className="wa-panel">
            <SectionHeader
              title="Conversion activity"
              description="Recorded registration, login and checkout events. These are event counts, not necessarily unique people."
            />

            <div className="wa-conversion-grid">
              <div className="wa-conversion-card">
                <span>Registration attempts</span>
                <strong>
                  {formatNumber(conversions.registrationAttempts)}
                </strong>
              </div>
              <div className="wa-conversion-card">
                <span>Registrations</span>
                <strong>{formatNumber(conversions.registrations)}</strong>
              </div>
              <div className="wa-conversion-card">
                <span>Logins</span>
                <strong>{formatNumber(conversions.logins)}</strong>
              </div>
              <div className="wa-conversion-card">
                <span>Checkout initiations</span>
                <strong>{formatNumber(conversions.checkoutInitiations)}</strong>
              </div>
            </div>

            <div className="wa-data-note">
              Successful payments and subscription revenue are not displayed
              here yet. They must be connected to verified backend payment
              records rather than browser-reported events.
            </div>
          </section>

          <div className="wa-three-column">
            <section className="wa-panel">
              <SectionHeader
                title="Devices"
                description="Visitor device types."
              />
              <BreakdownList items={devices} labelKey="_id" valueKey="count" />
            </section>

            <section className="wa-panel">
              <SectionHeader
                title="Browsers"
                description="Browsers used by visitors."
              />
              <BreakdownList items={browsers} labelKey="_id" valueKey="count" />
            </section>

            <section className="wa-panel">
              <SectionHeader
                title="Countries"
                description="Visitor locations."
              />
              <BreakdownList
                items={countries}
                labelKey="_id"
                valueKey="count"
              />
            </section>
          </div>

          <section className="wa-panel">
            <SectionHeader
              title="Recent activity"
              description="The latest recorded website events."
            />

            {recentActivity.length ? (
              <div className="wa-table-wrap">
                <table className="wa-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Page</th>
                      <th>Source</th>
                      <th>Visitor</th>
                      <th>Device</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item, index) => (
                      <tr key={item._id || `${item.visitorId}-${index}`}>
                        <td>
                          <span className="wa-event-badge">
                            {item.eventName}
                          </span>
                        </td>
                        <td className="wa-page-path" title={item.pagePath}>
                          {item.pagePath || "—"}
                        </td>
                        <td>{item.source || "direct"}</td>
                        <td className="wa-mono">
                          {item.visitorId
                            ? `${item.visitorId.slice(0, 8)}…`
                            : "—"}
                        </td>
                        <td>{item.deviceType || "—"}</td>
                        <td>
                          {formatDate(item.createdAt, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          <section className="wa-panel">
            <SectionHeader
              title="Recent sessions"
              description="Recorded browsing sessions within the selected period."
            />

            {sessions.length ? (
              <div className="wa-table-wrap">
                <table className="wa-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Landing page</th>
                      <th>Source</th>
                      <th>Pages</th>
                      <th>Duration</th>
                      <th>Device</th>
                      <th>Last activity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((item, index) => (
                      <tr key={`${item.visitorId}-${item.startedAt}-${index}`}>
                        <td className="wa-mono">
                          {item.visitorId
                            ? `${item.visitorId.slice(0, 8)}…`
                            : "—"}
                        </td>
                        <td className="wa-page-path" title={item.landingPage}>
                          {item.landingPage || "—"}
                        </td>
                        <td>{item.source || "direct"}</td>
                        <td>{formatNumber(item.pageViews)}</td>
                        <td>{formatDuration(item.durationSeconds)}</td>
                        <td>{item.deviceType || "—"}</td>
                        <td>
                          {formatDate(item.lastActivityAt, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <span
                            className={`wa-status ${
                              item.isActive ? "is-active" : "is-ended"
                            }`}
                          >
                            {item.isActive ? "Active" : "Ended"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No sessions recorded in this period." />
            )}
          </section>

          {analytics?.events && (
            <section className="wa-panel">
              <SectionHeader
                title="Event breakdown"
                description="All recorded event types in the selected period."
              />

              <div className="wa-event-grid">
                {Object.entries(analytics.events).map(([name, count]) => (
                  <div className="wa-event-count" key={name}>
                    <span>{name}</span>
                    <strong>{formatNumber(count)}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
