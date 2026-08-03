// Shared Chart.js defaults so every chart in the app looks consistent with
// the dark/emerald design system instead of Chart.js's light-mode defaults.
// Chart.js needs literal color strings (it doesn't read CSS custom
// properties), so these are kept in sync by hand with theme.css.
export const chartColors = {
  cyan: "#14b8a6",
  indigo: "#10b981",
  violet: "#8b5cf6",
  pink: "#f472b6",
  textSecondary: "#cbd2cf",
  textMuted: "#8a9a95",
  gridLine: "rgba(160, 175, 170, 0.12)",
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.textSecondary, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      backgroundColor: "rgba(19, 26, 24, 0.95)",
      borderColor: "rgba(160, 175, 170, 0.2)",
      borderWidth: 1,
      titleColor: "#f1f5f4",
      bodyColor: "#cbd2cf",
      padding: 10,
    },
  },
};
