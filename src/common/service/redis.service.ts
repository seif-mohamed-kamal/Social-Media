import { createClient, RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config.service";

class RedisService{
    private readonly client:RedisClientType;
    constructor(){
        this.client = createClient({url  : REDIS_URI } )
        this.handleError();
    }

    private handleError(){
        this.client.on("error" , (error)=>{
            console.log(`Redis Error ---- ${error}`)
        })
        this.client.on("reedy" , ()=>{
            console.log(`Redis Error`)
        })
    }

    public async connectToRedis(){
        await this.client.connect();
        console.log("Redis connected successfully👌")
    }
}

export const redisService = new RedisService();