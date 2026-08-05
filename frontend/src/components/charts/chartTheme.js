// Shared Chart.js defaults so every chart in the app looks consistent with
// the dark/indigo-violet design system instead of Chart.js's light-mode
// defaults. Chart.js needs literal color strings (it doesn't read CSS
// custom properties), so these are kept in sync by hand with theme.css.
export const chartColors = {
  cyan: "#8b85f0",
  indigo: "#6c63e0",
  violet: "#a78bfa",
  pink: "#f472b6",
  textSecondary: "#c7c5d3",
  textMuted: "#87859a",
  gridLine: "rgba(150, 148, 168, 0.12)",
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.textSecondary, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      backgroundColor: "rgba(23, 23, 33, 0.95)",
      borderColor: "rgba(150, 148, 168, 0.2)",
      borderWidth: 1,
      titleColor: "#f1f0f5",
      bodyColor: "#c7c5d3",
      padding: 10,
    },
  },
};
