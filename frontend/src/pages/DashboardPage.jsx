import React, { useEffect, useState, useCallback } from "react";
import { dashboardAPI } from "../services/api";
import "./DashboardPage.css";
import AnimatedNumber from "../components/AnimatedNumber";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import OnboardingTour from "../components/ui/OnboardingTour";
import { useToast } from "../components/ui/Toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="tooltip-value">
            {entry.name}: ${entry.value ? entry.value.toFixed(2) : "0.00"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{payload[0].name}</p>
        <p className="tooltip-value">{payload[0].value} invoices</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p style={{ color: payload[0].color }} className="tooltip-value">
          ${payload[0].value ? payload[0].value.toFixed(2) : "0.00"}
        </p>
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [projectProfit, setProjectProfit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const safeSummary = summary || {
    clientCount: 0,
    projectCount: 0,
    totalHours: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    monthlyRevenue: {
      totalRevenue: 0,
      totalPaid: 0,
      totalDue: 0,
      invoiceCount: 0,
    },
  };

  const monthlyRevenue = safeSummary.monthlyRevenue || {
    totalRevenue: 0,
    totalPaid: 0,
    totalDue: 0,
    invoiceCount: 0,
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        summaryRes,
        trendRes,
        statusRes,
        clientsRes,
        projectsRes,
      ] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getRevenueTrend(),
        dashboardAPI.getInvoiceStatusBreakdown(),
        dashboardAPI.getTopClientsByRevenue(5),
        dashboardAPI.getProjectProfitability(5),
      ]);

      setSummary(summaryRes.data);
      setRevenueTrend(trendRes.data);
      setInvoiceStatus(statusRes.data);
      setTopClients(clientsRes.data);
      setProjectProfit(projectsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const { show } = useToast();
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem("tour-completed");
  });

  useEffect(() => {
    if (error) show({ type: "error", message: error });
  }, [error, show]);

  if (loading)
    return (
      <div className="dashboard-page">
        <div className="stat-card-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="stat-card kpi-card">
              <SkeletonLoader lines={2} />
            </div>
          ))}
        </div>
        <div className="card">
          <SkeletonLoader lines={4} />
        </div>
        <div className="charts-grid">
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        </div>
      </div>
    );

  const invoiceStatusData = invoiceStatus
    ? [
        { name: "Paid", value: invoiceStatus.paid, color: "#10b981" },
        { name: "Pending", value: invoiceStatus.pending, color: "#f59e0b" },
        { name: "Overdue", value: invoiceStatus.overdue, color: "#ef4444" },
        { name: "Draft", value: invoiceStatus.draft, color: "#6b7280" },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <>
      <div className="dashboard-page">
        <div className="stat-card-grid">
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Clients</div>
            <div className="stat-card-value">
              <AnimatedNumber
                value={safeSummary.clientCount}
                duration={900}
                decimals={0}
                format={(v) => Math.round(v)}
              />
            </div>
          </div>
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Projects</div>
            <div className="stat-card-value">
              <AnimatedNumber
                value={safeSummary.projectCount}
                duration={900}
                decimals={0}
                format={(v) => Math.round(v)}
              />
            </div>
          </div>
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Total Hours</div>
            <div className="stat-card-value">
              <AnimatedNumber
                value={safeSummary.totalHours}
                duration={900}
                decimals={1}
                format={(v) => Number(v)}
              />
            </div>
          </div>
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Total Invoiced</div>
            <div className="stat-card-value">
              <AnimatedNumber
                value={safeSummary.totalInvoiced}
                duration={1000}
                decimals={2}
                format={(v) =>
                  `$${Number(v).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
              />
            </div>
          </div>
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Total Paid</div>
            <div className="stat-card-value stat-card-success">
              <AnimatedNumber
                value={safeSummary.totalPaid}
                duration={1000}
                decimals={2}
                format={(v) =>
                  `$${Number(v).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
              />
            </div>
          </div>
          <div className="stat-card kpi-card">
            <div className="stat-card-title">Outstanding</div>
            <div className="stat-card-value stat-card-danger">
              <AnimatedNumber
                value={safeSummary.totalOutstanding}
                duration={1000}
                decimals={2}
                format={(v) =>
                  `$${Number(v).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">This Month</h2>
          <div className="monthly-stats">
            <div className="monthly-stat">
              <span className="monthly-stat-label">Revenue:</span>
              <span className="monthly-stat-value">
                ${monthlyRevenue.totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="monthly-stat">
              <span className="monthly-stat-label">Paid:</span>
              <span className="monthly-stat-value stat-card-success">
                ${monthlyRevenue.totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="monthly-stat">
              <span className="monthly-stat-label">Due:</span>
              <span className="monthly-stat-value stat-card-danger">
                ${monthlyRevenue.totalDue.toFixed(2)}
              </span>
            </div>
            <div className="monthly-stat">
              <span className="monthly-stat-label">Invoices:</span>
              <span className="monthly-stat-value">
                {monthlyRevenue.invoiceCount}
              </span>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          {/* Revenue Trend Chart */}
          <div className="card chart-card revenue-chart-card">
            <div className="chart-header">
              <h2 className="card-title">📈 Revenue Trend</h2>
              <span className="chart-subtitle">Last 12 months</span>
            </div>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={revenueTrend}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4dbe6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    label={{ value: "Amount ($)", angle: -90, position: "insideLeft", fill: "#5a6b7f", fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                    name="Total Revenue"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorPaid)"
                    strokeWidth={2}
                    name="Paid"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="due"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorDue)"
                    strokeWidth={2}
                    name="Due"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state-text">No revenue data available</p>
            )}
          </div>

          {/* Invoice Status Pie Chart */}
          <div className="card chart-card pie-chart-card">
            <div className="chart-header">
              <h2 className="card-title">📋 Invoice Status</h2>
              <span className="chart-subtitle">Distribution breakdown</span>
            </div>
            {invoiceStatusData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", fontSize: "0.85rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {invoiceStatusData.map((item, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: item.color }} />
                      <span style={{ color: "#5a6b7f", fontWeight: 500 }}>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-state-text">No invoice data available</p>
            )}
          </div>
        </div>

        <div className="charts-grid">
          {/* Top Clients Chart */}
          <div className="card chart-card clients-chart-card">
            <div className="chart-header">
              <h2 className="card-title">⭐ Top Clients</h2>
              <span className="chart-subtitle">By revenue</span>
            </div>
            {topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topClients}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4dbe6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    label={{ value: "Revenue ($)", angle: -90, position: "insideLeft", fill: "#5a6b7f", fontSize: 10 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="url(#clientGradient)"
                    name="Revenue"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state-text">No client data available</p>
            )}
          </div>

          {/* Project Profitability Chart */}
          <div className="card chart-card projects-chart-card">
            <div className="chart-header">
              <h2 className="card-title">💰 Project Profitability</h2>
              <span className="chart-subtitle">Top performers</span>
            </div>
            {projectProfit.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={projectProfit}
                  margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                  layout="vertical"
                >
                  <defs>
                    <linearGradient id="projectGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4dbe6" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    label={{ value: "Profit ($)", position: "insideBottomRight", offset: -10, fill: "#5a6b7f", fontSize: 9 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "#5a6b7f" }}
                    width={100}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="profit"
                    fill="url(#projectGradient)"
                    name="Profit"
                    radius={[0, 6, 6, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state-text">No project data available</p>
            )}
          </div>
        </div>
      </div>
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
    </>
  );
};

export default DashboardPage;
