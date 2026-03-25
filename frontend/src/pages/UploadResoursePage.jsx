import "../styles/UploadResource.css";

function UploadResourcePage() {
  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Upload Resource</h2>

        <form>
          <label>Title</label>
          <input type="text" placeholder="Enter resource title" />

          <label>Subject</label>
          <select>
            <option>Operating Systems</option>
            <option>DBMS</option>
            <option>Computer Networks</option>
          </select>

          <label>Semester</label>
          <select>
            <option>Semester 1</option>
            <option>Semester 2</option>
            <option>Semester 3</option>
          </select>

          <label>Resource Type</label>
          <select>
            <option>PDF</option>
            <option>Video</option>
            <option>Link</option>
          </select>

          <label>Upload File / Paste Link</label>
          <input type="file" />

          <button type="submit">Upload</button>
        </form>
      </div>
    </div>
  );
}

export default UploadResourcePage;

