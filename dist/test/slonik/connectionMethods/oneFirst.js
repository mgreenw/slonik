"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const expect_type_1 = require("expect-type");
const zod_1 = require("zod");
const errors_1 = require("../../../src/errors");
const createSqlTag_1 = require("../../../src/factories/createSqlTag");
const createPool_1 = require("../../helpers/createPool");
const sql = (0, createSqlTag_1.createSqlTag)();
(0, ava_1.default)('returns value of the first column from the first row', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: 1,
            },
        ],
    });
    const result = await pool.oneFirst(sql `SELECT 1`);
    t.is(result, 1);
});
(0, ava_1.default)('throws an error if no rows are returned', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [],
    });
    const error = await t.throwsAsync(pool.oneFirst(sql `SELECT 1`));
    t.true(error instanceof errors_1.NotFoundError);
});
(0, ava_1.default)('throws an error if more than one row is returned', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: 1,
            },
            {
                foo: 2,
            },
        ],
    });
    const error = await t.throwsAsync(pool.oneFirst(sql `SELECT 1`));
    t.true(error instanceof errors_1.DataIntegrityError);
});
(0, ava_1.default)('throws an error if more than one column is returned', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                bar: 1,
                foo: 1,
            },
        ],
    });
    const error = await t.throwsAsync(pool.oneFirst(sql `SELECT 1`));
    t.true(error instanceof errors_1.UnexpectedStateError);
});
(0, ava_1.default)('describes zod object associated with the query', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: 1,
            },
        ],
    });
    const zodObject = zod_1.z.object({
        foo: zod_1.z.number(),
    });
    const query = sql.type(zodObject) `SELECT 1`;
    const result = await pool.oneFirst(query);
    (0, expect_type_1.expectTypeOf)(result).toMatchTypeOf();
    t.is(result, 1);
});
(0, ava_1.default)('throws an error if object does match the zod object shape', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: '1',
            },
        ],
    });
    const zodObject = zod_1.z.object({
        foo: zod_1.z.number(),
    });
    const query = sql.type(zodObject) `SELECT 1`;
    const error = await t.throwsAsync(pool.oneFirst(query));
    t.is(error === null || error === void 0 ? void 0 : error.sql, 'SELECT 1');
    t.deepEqual(error === null || error === void 0 ? void 0 : error.row, {
        foo: '1',
    });
    t.deepEqual(error === null || error === void 0 ? void 0 : error.issues, [
        {
            code: 'invalid_type',
            expected: 'number',
            message: 'Expected number, received string',
            path: [
                'foo',
            ],
            received: 'string',
        },
    ]);
});