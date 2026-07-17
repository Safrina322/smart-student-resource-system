import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { chartColors, baseChartOptions } from "./chartTheme.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const PALETTE = [chartColors.cyan, chartColors.indigo, chartColors.violet, chartColors.pink, "#34d399"];

function TopSubjectsChart({ subjects }) {
  const data = {
    labels: subjects.map((item) => item.subject),
    datasets: [
      {
        data: subjects.map((item) => item.count),
        backgroundColor: subjects.map((_, idx) => PALETTE[idx % PALETTE.length]),
        borderRadius: 6,
        maxBarThickness: 22,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    indexAxis: "y",
    plugins: { ...baseChartOptions.plugins, legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: chartColors.textMuted, precision: 0 },
        grid: { color: chartColors.gridLine },
      },
      y: {
        ticks: { color: chartColors.textSecondary },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: Math.max(180, subjects.length * 44) }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default TopSubjectsChart;
