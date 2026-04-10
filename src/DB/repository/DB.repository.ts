import { AnyKeys, CreateOptions, HydratedDocument, Model } from "mongoose";

export abstract class DataBaseRepository<T>{
    constructor(protected readonly model:Model<T>){}

    async create({
        data,
        option
    }:{
        data:AnyKeys<T>[],
        option?: CreateOptions | undefined,
    }):Promise<HydratedDocument<T>[]>{
        return await this.model.create(data as any , option)
    }
}