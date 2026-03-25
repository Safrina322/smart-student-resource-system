import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoute.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRequestRoutes from "./routes/adminRequestRoutes.js";
dotenv.config();

const app = express();

// ✅ Configure CORS to only allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use("/api/admin", adminAuthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);

// 🔓 expose images folder
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/images", express.static("images"));

// ROUTES (ALWAYS BEFORE listen)
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/courses", courseRoutes);




// START SERVER (LAST)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


// 🔥 ADD THIS AT THE VERY BOTTOM
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});