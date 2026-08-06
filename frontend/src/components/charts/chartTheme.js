// Shared Chart.js defaults so every chart in the app looks consistent with
// the dark, single-teal-accent design system instead of Chart.js's
// light-mode defaults. Chart.js needs literal color strings (it doesn't
// read CSS custom properties), so these are kept in sync by hand with
// theme.css.
export const chartColors = {
  cyan: "#5eead4",
  teal: "#14b8a6",
  violet: "#a78bfa",
  pink: "#f472b6",
  textSecondary: "#c7c9d1",
  textMuted: "#9ca3af",
  gridLine: "rgba(42, 47, 58, 0.6)",
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.textSecondary, usePointStyle: true, boxWidth: 8 },
    },
    tooltip: {
      backgroundColor: "#1c202a",
      borderColor: "#2a2f3a",
      borderWidth: 1,
      titleColor: "#f3f4f6",
      bodyColor: "#c7c9d1",
      padding: 10,
    },
  },
};
