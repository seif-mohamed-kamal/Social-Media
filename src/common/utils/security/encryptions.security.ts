import { ENCRYPT_KEY } from "../../../config/config.service";
import { BadRequestException } from "../../exceptions/domain.exception";
import crypto from 'node:crypto'
export const generateEncrypt =async (plainText: string):Promise<string> => {
  const iv = crypto.randomBytes(16);
  if (!ENCRYPT_KEY) {
    throw new Error("ENCRYPT_KEY is not defined");
  }  
  const cipherIv = crypto.createCipheriv("aes-256-cbc", ENCRYPT_KEY, iv) ;
  let encrypted = cipherIv.update(plainText, "utf8", "hex");
  encrypted += cipherIv.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const generateDecrypt = async(cipherText:string):Promise<string> => {
  const [ iv, encryptedData ] = cipherText.split(":") || [] as string[];
  if(!iv || !encryptedData){
    throw new BadRequestException("Missing Encryption Parts")
  }
  if (!ENCRYPT_KEY) {
    throw new Error("ENCRYPT_KEY is not defined");
  }  
  const ivBuffer = Buffer.from(iv, 'hex');
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPT_KEY, ivBuffer);
  let plainText = decipher.update(encryptedData, "hex", "utf8");
  plainText += decipher.final("utf8");
  return plainText;
};