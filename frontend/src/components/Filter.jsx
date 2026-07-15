function Filter({
  value = "",
  onChange,
  options = [],
  placeholder = "All",
  className = "",
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      className={className}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
export default Filter;
