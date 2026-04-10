import { connect} from "mongoose";
import { DB_URI } from "../config/config.service";

export const connectToDB = async()=>{
    try {
        await connect(DB_URI);
        console.log('DB Connected Successfully👌')
    } catch (error) { 
        console.log(`Fail to connect To DB ... ${error}`)
    }
}