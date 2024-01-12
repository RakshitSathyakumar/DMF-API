import express from "express";
import { adminOnly } from "../Middleware/auth.js";
import {
  getPieCharts,
  getDashboardStats,
  getBarCharts,
  getLineCharts,
} from "../Controllers/dashboardController.js";
const app = express.Router();

app.get("/stats", adminOnly, getDashboardStats);
app.get("/pie", adminOnly, getPieCharts);
app.get("/bar", adminOnly, getBarCharts);
app.get("/line",adminOnly,getLineCharts);

export default app;
