function ResourceCard({ title = "Resource Title", type = "PDF" }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h3>{title}</h3>
      <p>Type: {type}</p>
      <button>View / Download</button>
    </div>
  );
}
export default ResourceCard;
