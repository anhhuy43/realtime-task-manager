import authRoutes from "./auth.js";
import employeeRoutes from "./employeeOwner.js";

function route(app) {
  app.use("/api", authRoutes);
  app.use("/api/owner/employees", employeeRoutes);
}

export default route;
