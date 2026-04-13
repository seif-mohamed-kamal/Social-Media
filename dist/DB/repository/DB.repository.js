"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, option, }) {
        return await this.model.create(data, option);
    }
    async createOne({ data, option, }) {
        const [doc] = (await this.create({ data: [data], option })) || [];
        return doc;
    }
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async findById({ _id, projection, options, }) {
        const doc = this.model.findOne(_id, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        return this.model.updateOne(filter, update, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, }) {
        return this.model.findOneAndUpdate(filter, update, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true }, }) {
        return this.model.findByIdAndUpdate(_id, update, options);
    }
    async updateMany({ filter, update, options, }) {
        return this.model.updateMany(filter, update, options);
    }
    async deleteOne({ filter }) {
        return this.model.deleteOne(filter);
    }
    async findOneAndDelete({ filter, }) {
        return this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return this.model.findByIdAndDelete(_id);
    }
    async deleteMany({ filter, }) {
        return this.model.deleteMany(filter);
    }
}
exports.DataBaseRepository = DataBaseRepository;
