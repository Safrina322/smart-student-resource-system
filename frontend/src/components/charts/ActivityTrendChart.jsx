import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { chartColors, baseChartOptions } from "./chartTheme.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function ActivityTrendChart({ labels, approvalsByDay, resourceOpensByDay }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Approvals",
        data: approvalsByDay,
        backgroundColor: chartColors.cyan,
        borderRadius: 6,
        maxBarThickness: 28,
      },
      {
        label: "Resource Opens",
        data: resourceOpensByDay,
        backgroundColor: chartColors.indigo,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    scales: {
      x: {
        ticks: { color: chartColors.textMuted },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: chartColors.textMuted, precision: 0 },
        grid: { color: chartColors.gridLine },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default ActivityTrendChart;
