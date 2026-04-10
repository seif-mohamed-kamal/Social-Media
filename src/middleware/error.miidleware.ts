import { NextFunction, Request, Response } from "express";

interface IError extends Error{
    statusCode:number;
}
export const globalErrorHandling = (error:IError , req:Request , res:Response , next:NextFunction)=>{
    const status = error.statusCode || 500;
    return res.status(status).json({message:error.message || 'internal server error' , error , cause:error.cause , stack:error.stack})
} 