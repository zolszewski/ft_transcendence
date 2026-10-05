import express from "express";
import { sessionMiddleware } from "./middleware/session";
import authRoutes from "./routes/auth.routes";
import articleRoutes from "./routes/article.routes";
import reviewRoutes from "./routes/review.routes"
import commentRoutes from "./routes/comment.routes";
import chatRoutes from "./routes/chat.routes";
import http from "http";
import { initSocketServer } from "./lib/socket";
import { errorHandler } from "./middleware/errorHandler";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { resolveApiKey } from "./middleware/auth";
import uploadRoutes from "./routes/upload.routes"
import userRoutes from "./routes/user.routes"
import dashboardRoutes from "./routes/dashboard.routes"
import friendRoutes from "./routes/friend.routes"

const app = express();
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 300 : 2000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  skip: (req) =>
    req.method === "GET" && /^\/api\/uploads\/[^/]+$/.test(req.path),
});

app.use(helmet());
app.use(apiLimiter);
app.use(express.json());
app.use(sessionMiddleware);
app.use(resolveApiKey);
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/friends", friendRoutes);


app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
  });
});

app.use(errorHandler); // laisser en dernier, ne surtout pas placer de routes après cette commande
const httpServer = http.createServer(app);
initSocketServer(httpServer);

const PORT = 4000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});