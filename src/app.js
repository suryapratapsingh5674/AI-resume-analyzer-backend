import express from "express";
import authrouter from "./routes/auth.router.js";
import airouter from './routes/ai.routes.js'
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://ai-resume-analyzer-frontend-nu.vercel.app",
    credentials: true,
  }),
);
app.use("/api/auth", authrouter);
app.use("/api/ai", airouter);

export default app;
