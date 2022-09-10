"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const createSqlTag_1 = require("../../../../src/factories/createSqlTag");
const tokens_1 = require("../../../../src/tokens");
const sql = (0, createSqlTag_1.createSqlTag)();
(0, ava_1.default)('binds a timestamp', (t) => {
    const query = sql `SELECT ${sql.timestamp(new Date('2022-08-19T03:27:24.951Z'))}`;
    t.deepEqual(query, {
        sql: 'SELECT to_timestamp($1)',
        type: tokens_1.SqlToken,
        values: [
            '1660879644.951',
        ],
    });
});
(0, ava_1.default)('throws if not instance of Date', (t) => {
    const error = t.throws(() => {
        // @ts-expect-error
        sql `SELECT ${sql.timestamp(1)}`;
    });
    t.is(error === null || error === void 0 ? void 0 : error.message, 'Timestamp parameter value must be an instance of Date.');
});