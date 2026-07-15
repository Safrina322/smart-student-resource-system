import "../styles/Skeleton.css";

export function Skeleton({ width = "100%", height = "1em", radius, className = "" }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonTableRows({ rows = 5, columns = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} className="skeleton-row">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <td key={colIndex}>
          <Skeleton height="0.9em" width={colIndex === columns - 1 ? "60%" : "80%"} />
        </td>
      ))}
    </tr>
  ));
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton height="140px" radius="var(--radius-md)" />
      <Skeleton height="1.1em" width="70%" />
      <Skeleton height="0.85em" width="45%" />
      <Skeleton height="0.85em" width="55%" />
    </div>
  );
}

export default Skeleton;
