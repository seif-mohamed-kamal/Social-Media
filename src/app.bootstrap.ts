import express from "express"
import { authRouter } from "./modules";
import { globalErrorHandling } from "./middleware";
import { port } from "./config/config.service";
import { connectToDB } from "./DB";
import { redisService } from "./common/service";
const bootstrap=async()=>{
    const app: express.Express = express();

    app.use(express.json())
    await connectToDB()
    await redisService.connectToRedis();
    app.use('/auth' , authRouter)
    app.get("/" , (req:express.Request , res:express.Response , next:express.NextFunction) => {
        res.status(200).json({message:"Landing Page"})
    })

    app.use(globalErrorHandling)
    app.listen(port,()=>{
        console.log(`App running successfully on port ${port}`)
    })
}

export default bootstrap;