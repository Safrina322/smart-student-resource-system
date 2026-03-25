function Filter({ label = "Filter" }) {
  return (
    <select style={{ padding: "5px", margin: "5px" }}>
      <option>{label} 1</option>
      <option>{label} 2</option>
    </select>
  );
}
export default Filter;
