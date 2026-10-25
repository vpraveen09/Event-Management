require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const eventRoutes = require("./routes/events");
const vendorRoutes = require("./routes/vendors");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const sessionRoutes = require("./routes/sessions");
const attachmentRoutes = require("./routes/attachments");
const sceneryRoutes = require("./routes/scenery");
const exportRoutes = require("./routes/export");
const { syncEventStatuses } = require("./statusSync");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/scenery", sceneryRoutes);
app.use("/api/export", exportRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

syncEventStatuses();
setInterval(syncEventStatuses, 15 * 60 * 1000);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Event Management API listening on http://localhost:${port}`));
