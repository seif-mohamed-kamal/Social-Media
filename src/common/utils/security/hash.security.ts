import {hash , compare} from 'bcrypt'
import { SALT_ROUND } from '../../../config/config.service'

export async function generateHash({
    plainText,
    salt = SALT_ROUND
}:{
    plainText: string,
    salt?:number
}):Promise<string>{
    return await hash(plainText , salt);
}

export async function comapareeHash({
    plainText,
    ciphetText,
}:{
    plainText: string,
    ciphetText:string
}):Promise<boolean>{
    return await compare(plainText , ciphetText);
}