import {type Response } from "express";

export const successResponse = <T>({
  res,
  message = "Done",
  status = 200,
  result,
}: {
  res: Response;
  message?: string;
  status?: number;
  result: T;
}) => {
  return res.status(status).json({ message, status, result });
};
