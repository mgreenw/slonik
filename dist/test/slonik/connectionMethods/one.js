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
(0, ava_1.default)('returns the first row', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: 1,
            },
        ],
    });
    const result = await pool.one(sql `SELECT 1`);
    t.deepEqual(result, {
        foo: 1,
    });
});
(0, ava_1.default)('throws an error if no rows are returned', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [],
    });
    const error = await t.throwsAsync(pool.one(sql `SELECT 1`));
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
    const error = await t.throwsAsync(pool.one(sql `SELECT 1`));
    t.true(error instanceof errors_1.DataIntegrityError);
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
    const result = await pool.one(query);
    (0, expect_type_1.expectTypeOf)(result).toMatchTypeOf();
    t.deepEqual(result, {
        foo: 1,
    });
});
(0, ava_1.default)('uses zod transform', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    pool.querySpy.returns({
        rows: [
            {
                foo: '1,2',
            },
        ],
    });
    const coordinatesType = zod_1.z.string().transform((subject) => {
        const [x, y,] = subject.split(',');
        return {
            x: Number(x),
            y: Number(y),
        };
    });
    const zodObject = zod_1.z.object({
        foo: coordinatesType,
    });
    const query = sql.type(zodObject) `SELECT '1,2' as foo`;
    const result = await pool.one(query);
    (0, expect_type_1.expectTypeOf)(result).toMatchTypeOf();
    t.deepEqual(result, {
        foo: {
            x: 1,
            y: 2,
        },
    });
});
(0, ava_1.default)('throws an error if property type does not conform to zod object (invalid_type)', async (t) => {
    var _a;
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
    const error = await t.throwsAsync(pool.one(query));
    if (!error) {
        throw new Error('Expected SchemaValidationError');
    }
    t.is(error.issues.length, 1);
    t.is((_a = error.issues[0]) === null || _a === void 0 ? void 0 : _a.code, 'invalid_type');
});
