import express from "express";
import { sessionMiddleware } from "./middleware/session";
import authRoutes from "./routes/auth.routes";
import articleRoutes from "./routes/article.routes";
import reviewRoutes from "./routes/review.routes"
import commentRoutes from "./routes/comment.routes";

const app = express();

app.use(express.json());
app.use(sessionMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/uploads", express.static("/app/public/uploads"));
app.use("/api/reviews", reviewRoutes);
app.use("/api/comments", commentRoutes);


app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
  });
});

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});