"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const enum_1 = require("../../common/enum");
const security_1 = require("../../common/utils/security");
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [2, "firstname cannot be less than 2 characters"],
        maxLength: [25, "firstname cannot exceed 25 characters"],
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        minLength: [2, "lastname cannot be less than 2 characters"],
        maxLength: [25, "lastname cannot exceed 25 characters"],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            return this.provider == enum_1.ProviderEnum.SYSTEM;
        },
    },
    age: Number,
    phone: String,
    gender: {
        type: Number,
        enum: enum_1.GenderEnum,
        default: enum_1.GenderEnum.MALE,
    },
    role: {
        type: Number,
        enum: enum_1.RoleEnum,
        default: enum_1.RoleEnum.USER,
    },
    provider: {
        type: Number,
        enum: enum_1.ProviderEnum,
        default: enum_1.ProviderEnum.SYSTEM,
    },
    profilePicture: String,
    coverPictures: [String],
    confirmEmail: Date,
    deletedAt: Date,
    restoredAt: Date,
    changeCreadintialTime: Date,
}, {
    collection: "Route_users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("save", async function () {
    this.wasNew = this.isNew;
    if (this.password && this.isModified("password")) {
        this.password = await (0, security_1.generateHash)({ plainText: this.password });
    }
    if (this.phone && this.isModified("phone")) {
        this.phone = await (0, security_1.generateEncrypt)(this.phone);
    }
});
userSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
userSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    }
    else if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
userSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    if (query.force === true) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.userModel = mongoose_1.default.models.user || mongoose_1.default.model("user", userSchema);
