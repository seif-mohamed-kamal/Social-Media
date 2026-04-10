export class ApplicationException extends Error {
  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name
  }
}

