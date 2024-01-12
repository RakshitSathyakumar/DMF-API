import express from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../Controllers/productController.js";
import { singleUpload } from "../Middleware/multer.js";
import { adminOnly } from "../Middleware/auth.js";
const app = express.Router();

app.post("/new", singleUpload, newProduct);

app.get('/all',getAllProducts);

app.get('/categories',getAllCategories);

app.get("/latest", getLatestProducts);

app.get("/admin-products", adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .delete(adminOnly, deleteProduct)
  .put(singleUpload, updateProduct);

export default app;
