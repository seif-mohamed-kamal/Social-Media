"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, option }) {
        return await this.model.create(data, option);
    }
}
exports.DataBaseRepository = DataBaseRepository;
