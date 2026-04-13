import { EventEmitter } from "node:events";

export const emitEmail = new EventEmitter();

emitEmail.on('sendEmail',async(fn)=>{
    try {
        await fn()
    } catch (error) {
        console.log(`Error to send Email ${error}`)
    }
})