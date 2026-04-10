import { IUser } from "../../common/interface";
import { userModel } from "../model";
import { DataBaseRepository } from "./DB.repository";

export class userRepository extends DataBaseRepository<IUser>{
    constructor(){
        super(userModel)
    }
}