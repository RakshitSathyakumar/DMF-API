import { Request } from "express";
import { redis, redisTTL } from "../app.js";
import { TryCatch } from "../Middleware/error.js";
import { Order } from "../Models/order.js";
import { Product } from "../Models/product.js";
import { Review } from "../Models/review.js";
import { User } from "../Models/user.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../Types/types.js";
import {
  deleteFromCloudinary,
  findAverageRatings,
  invalidateCache,
  uploadToCloudinary,
} from "../Utils/features.js";
import ErrorHandler from "../Utils/utility-class.js";

// New Product Creation --> Cache needs to revalidated
export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category, description } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add Photo", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Please add atleast one Photo", 400));

    if (photos.length > 5)
      return next(new ErrorHandler("You can only upload 5 Photos", 400));

    if (!name || !price || !stock || !category || !description)
      return next(new ErrorHandler("Please enter All Fields", 400));

    // Upload Here

    const photosURL = await uploadToCloudinary(photos);
    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photos: photosURL,
      description: description,
    });

    await invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

// To get latest Products --> to Store data in Cache
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;
  products = await redis.get("latest-product");
  if (products) {
    products = JSON.parse(products);
  } else {
    products = await Product.find({}).sort({ ratings: -1 }).limit(4);
    await redis.setex("latest-products", redisTTL, JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    products,
  });
});

// To get all categories --> to Store data in Cache
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  categories = await redis.get("categories");
  if (categories) {
    categories = JSON.parse(categories);
  } else {
    categories = await Product.distinct("category");
    await redis.setex("categories", redisTTL, JSON.stringify(categories));
  }

  res.status(200).json({
    success: true,
    categories,
  });
});

// Admin Route to get all the listed products  --> to Store data in Cache
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  products = await redis.get("all-products");
  if (products) products = JSON.parse(products);
  else {
    products = await Product.find({});
    await redis.setex("all-products", redisTTL, JSON.stringify(products));
  }
  res.status(200).json({
    success: true,
    products,
  });
});
// Details of a single product  --> to Store data in Cache
export const getSingleProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  let product;
  const key = `product-${id}`;
  product = await redis.get(key);
  if (product) product = JSON.parse(product);
  else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));
    await redis.setex(key, redisTTL, JSON.stringify(product));
  }
  res.status(200).json({
    success: true,
    product,
  });
});
// Admin Route to delte a procuct --> Cache needs to revalidated
export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const public_ids = product.photos.map((i) => i.public_id);
  await deleteFromCloudinary(public_ids);

  await product.deleteOne();
  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  res.status(201).json({
    success: true,
    message: "The Product is deleted",
  });
});
// Admin Route to update a product --> Cache needs to revalidated
export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category, description } = req.body;
  const photosFile = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  if (photosFile && photosFile.length > 0) {
    try {
      const newPhotos = await uploadToCloudinary(photosFile);

      const ids = product.photos?.map((photo) => photo.public_id) || [];
      if (ids.length > 0) {
        await deleteFromCloudinary(ids);
      }

      product.photos.splice(0, product.photos.length);
      newPhotos.forEach((photo) => {
        product.photos.push({ public_id: photo.public_id, url: photo.url });
      });
    } catch (error) {
      return next(new ErrorHandler("Photo upload failed", 500));
    }
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;
  if (description) product.description = description;

  await product.save();

  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

// search fucntion --> Tough one

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const key = `products-${search}-${sort}-${category}-${price}-${page}`;

    let products;
    let totalPage;

    const cachedData = await redis.get(key);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      totalPage = data.totalPage;
      products = data.products;
    } else {
      const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
      const skip = (page - 1) * limit;

      const baseQuery: BaseQuery = {};

      if (search)
        baseQuery.name = {
          $regex: search,
          $options: "i",
        };

      if (price)
        baseQuery.price = {
          $lte: Number(price),
        };

      if (category) baseQuery.category = category;

      const productsPromise = Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);

      const [productsFetched, filteredOnlyProduct] = await Promise.all([
        productsPromise,
        Product.find(baseQuery),
      ]);

      products = productsFetched;
      totalPage = Math.ceil(filteredOnlyProduct.length / limit);

      await redis.setex(key, 30, JSON.stringify({ products, totalPage }));
    }

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const newReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);
  if (!user) return next(new ErrorHandler("Not Logged In", 404));

  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const { comment, rating } = req.body;

  let alreadyReviewed = await Review.findOne({
    user: user._id,
    product: product._id,
  });

  if (alreadyReviewed) {
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;
    let verifiedPurchase = false;
    const orders = await Order.find({ user: user._id });
    console.log("orders", orders);
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          if (item.productId!.toString() === product._id.toString()) {
            verifiedPurchase = true;
          }
        });
      });
    }
    alreadyReviewed.verifiedPurchase = verifiedPurchase;
    await alreadyReviewed.save();
  } else {
    let verifiedPurchase = false;
    const orders = await Order.find({ user: user._id });

    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        order.orderItems.forEach((item) => {
          if (item.productId!.toString() === product._id.toString()) {
            verifiedPurchase = true;
          }
        });
      });
    }

    const review = await Review.create({
      comment,
      rating,
      user: user._id,
      product: product._id,
      verifiedPurchase,
    });
  }

  // Recalculate average rating and review count
  const { ratings, numOfReviews } = await findAverageRatings(product._id);
  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
    review: true,
  });

  return res.status(alreadyReviewed ? 200 : 201).json({
    success: true,
    message: alreadyReviewed ? "Review Updated" : "Review Added",
  });
});

export const allReview = TryCatch(async (req, res, next) => {
  let reviews;
  const key = `reviews-${req.params.id}`;

  reviews = await redis.get(key);
  if (reviews) reviews = JSON.parse(reviews);
  else {
    reviews = await Review.find({ product: req.params.id })
      .populate("user", "name photo")
      .sort({ updatedAt: -1 });
    await redis.setex(key, redisTTL, JSON.stringify(reviews));
  }

  return res.status(200).json({
    success: true,
    reviews,
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);

  if (!user) return next(new ErrorHandler("Not Logged In", 404));

  const review = await Review.findById(req.params.id);
  if (!review) return next(new ErrorHandler("Review Not Found", 404));

  const isAuthenticUser = review.user.toString() === user._id.toString();

  if (!isAuthenticUser) return next(new ErrorHandler("Not Authorized", 401));

  await review.deleteOne();

  const product = await Product.findById(review.product);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const { ratings, numOfReviews } = await findAverageRatings(product._id);

  product.ratings = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Review Deleted",
  });
});
