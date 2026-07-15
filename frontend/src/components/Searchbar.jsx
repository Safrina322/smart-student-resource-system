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
      aria-label={placeholder}
    />
  );
}
export default SearchBar;
