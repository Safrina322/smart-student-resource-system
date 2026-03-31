function SearchBar({
  value = "",
  onChange,
  placeholder = "Search resources...",
  className = "",
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      className={className}
      style={{ padding: "10px", width: "100%" }}
    />
  );
}
export default SearchBar;
