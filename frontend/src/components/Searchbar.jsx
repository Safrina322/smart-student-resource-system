function SearchBar({ placeholder = "Search resources..." }) {
  return <input type="text" placeholder={placeholder} style={{ padding: "5px", width: "100%" }} />;
}
export default SearchBar;
