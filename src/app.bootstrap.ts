import express from "express";
import { authRouter, userRouter } from "./modules";
import { globalErrorHandling } from "./middleware";
import { port } from "./config/config.service";
import { connectToDB } from "./DB";
import { redisService } from "./common/service";
import cors from "cors";

const bootstrap = async () => {
  const app: express.Express = express();

  app.use(cors(), express.json());
  await connectToDB();
  await redisService.connectToRedis();
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      res.status(200).json({ message: "Landing Page" });
    }
  );

  app.use(globalErrorHandling);
  app.listen(port, () => {
    console.log(`App running successfully on port ${port}`);
  });
};

export default bootstrap;
