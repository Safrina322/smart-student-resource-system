import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "../styles/RoleDashboard.css";
import {
  listMyResources,
  uploadResource,
  updateResource,
  deleteResource,
  getLecturerAnalytics,
} from "../services/lecturerResourceService.js";
import { notify } from "../utils/notify.js";
import { SkeletonTableRows } from "../components/Skeleton.jsx";

const RESOURCE_TYPES = ["PDF", "Video", "Link", "Image", "ZIP", "Document"];

const emptyForm = {
  title: "",
  description: "",
  subject: "",
  department: "",
  semester: "",
  resourceType: "PDF",
  resourceLink: "",
  tags: "",
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function LecturerDashboard() {
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState({ pending: 0, approved: 0, rejected: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyForm });

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, summary] = await Promise.all([listMyResources(), getLecturerAnalytics()]);
      setResources(list);
      setAnalytics(summary);
    } catch (err) {
      setLoadError(err.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      semester: values.semester === "" ? undefined : values.semester,
    };
    try {
      if (editingId) {
        const data = await updateResource(editingId, payload);
        notify.success(data.message);
      } else {
        const data = await uploadResource(payload);
        notify.success(data.message);
      }
      reset(emptyForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      notify.error(err.message || "Could not save resource.");
    }
  };

  const startEdit = (resource) => {
    setEditingId(resource.id);
    reset({
      title: resource.title,
      description: resource.description || "",
      subject: resource.subject || "",
      department: resource.department || "",
      semester: resource.semester || "",
      resourceType: resource.resource_type,
      resourceLink: resource.resource_link,
      tags: resource.tags || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset(emptyForm);
  };

  const handleDelete = async (id) => {
    try {
      await deleteResource(id);
      notify.success("Resource deleted");
      loadData();
    } catch (err) {
      notify.error(err.message || "Could not delete resource.");
    }
  };

  return (
    <div className="role-dashboard">
      <h1>Lecturer Dashboard</h1>

      <div className="role-stats">
        <div className="role-stat-card">
          <span>Pending</span>
          <strong>{analytics.pending}</strong>
        </div>
        <div className="role-stat-card">
          <span>Approved</span>
          <strong>{analytics.approved}</strong>
        </div>
        <div className="role-stat-card">
          <span>Rejected</span>
          <strong>{analytics.rejected}</strong>
        </div>
        <div className="role-stat-card">
          <span>Flagged</span>
          <strong>{analytics.flagged}</strong>
        </div>
      </div>

      <section className="role-card">
        <h2>{editingId ? "Edit Resource" : "Upload Resource"}</h2>
        {loadError && <p className="role-message">{loadError}</p>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="role-grid">
            <div className="role-field role-field-wide">
              <label>Title</label>
              <input type="text" {...register("title", { required: "Title is required" })} />
              {errors.title && <span className="role-error">{errors.title.message}</span>}
            </div>
            <div className="role-field role-field-wide">
              <label>Description</label>
              <textarea rows={3} {...register("description")} />
            </div>
            <div className="role-field">
              <label>Subject</label>
              <input type="text" {...register("subject")} />
            </div>
            <div className="role-field">
              <label>Department</label>
              <input type="text" {...register("department")} />
            </div>
            <div className="role-field">
              <label>Semester</label>
              <input type="number" min="1" max="12" {...register("semester")} />
            </div>
            <div className="role-field">
              <label>Resource Type</label>
              <select {...register("resourceType")}>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="role-field role-field-wide">
              <label>Resource Link (URL)</label>
              <input
                type="text"
                {...register("resourceLink", { required: "Resource link is required" })}
              />
              {errors.resourceLink && <span className="role-error">{errors.resourceLink.message}</span>}
            </div>
            <div className="role-field role-field-wide">
              <label>Tags (comma separated)</label>
              <input type="text" {...register("tags")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="role-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Upload"}
            </button>
            {editingId && (
              <button type="button" className="role-btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="role-card">
        <h2>My Resources</h2>
        {!loading && resources.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No resources uploaded yet.</p>
        ) : (
          <div className="role-table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Review Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTableRows rows={4} columns={5} />
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id}>
                      <td>{resource.title}</td>
                      <td>{resource.resource_type}</td>
                      <td><StatusBadge status={resource.status} /></td>
                      <td>{resource.review_comment || "—"}</td>
                      <td>
                        <button className="role-link-btn" onClick={() => startEdit(resource)}>Edit</button>
                        <button className="role-link-btn role-link-danger" onClick={() => handleDelete(resource.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default LecturerDashboard;
