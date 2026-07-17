// Shared Chart.js defaults so every chart in the app looks consistent with
// the dark/blue design system instead of Chart.js's light-mode defaults.
export const chartColors = {
  cyan: "#22d3ee",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  pink: "#f472b6",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  gridLine: "rgba(148, 163, 184, 0.12)",
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.textSecondary, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(148, 163, 184, 0.2)",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      padding: 10,
    },
  },
};
