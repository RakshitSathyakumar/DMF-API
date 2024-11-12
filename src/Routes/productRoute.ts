import express from "express";
import {
  allReview,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  newReview,
  updateProduct,
} from "../Controllers/productController.js";
import { mutliUpload } from "../Middleware/multer.js";
import { adminOnly } from "../Middleware/auth.js";
const app = express.Router();

app.post("/new", mutliUpload, newProduct);

app.get("/all", getAllProducts);

app.get("/categories", getAllCategories);

app.get("/latest", getLatestProducts);

app.get("/admin-products", adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .delete(adminOnly, deleteProduct)
  .put(adminOnly, mutliUpload, updateProduct);

  app.get("/reviews/:id", allReview);
  app.post("/review/new/:id", newReview);
  app.delete("/review/:id", deleteReview);

export default app;
