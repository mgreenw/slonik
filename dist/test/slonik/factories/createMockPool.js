"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const sinon = __importStar(require("sinon"));
const src_1 = require("../../../src");
const createMockPool_1 = require("../../../src/factories/createMockPool");
const createMockQueryResult_1 = require("../../../src/factories/createMockQueryResult");
(0, ava_1.default)('executes a mock query (pool.query)', async (t) => {
    t.plan(4);
    const overrides = {
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
            ]);
        },
    };
    const query = sinon.spy(overrides, 'query');
    const pool = (0, createMockPool_1.createMockPool)(overrides);
    const results = await pool.query((0, src_1.sql) `
    SELECT ${'foo'}
  `);
    t.deepEqual(results.rows, [
        {
            foo: 'bar',
        },
    ]);
    t.is(query.callCount, 1);
    t.is(query.firstCall.args[0].trim(), 'SELECT $1');
    t.deepEqual(query.firstCall.args[1], [
        'foo',
    ]);
});
(0, ava_1.default)('create a mock pool and executes a mock query (pool.connect)', async (t) => {
    t.plan(4);
    const overrides = {
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
            ]);
        },
    };
    const query = sinon.spy(overrides, 'query');
    const pool = (0, createMockPool_1.createMockPool)(overrides);
    await pool.connect(async (connection) => {
        const results = await connection.query((0, src_1.sql) `
      SELECT ${'foo'}
    `);
        t.deepEqual(results.rows, [
            {
                foo: 'bar',
            },
        ]);
    });
    t.is(query.callCount, 1);
    t.is(query.firstCall.args[0].trim(), 'SELECT $1');
    t.deepEqual(query.firstCall.args[1], [
        'foo',
    ]);
});
(0, ava_1.default)('executes a mock transaction', async (t) => {
    const overrides = {
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
            ]);
        },
    };
    const query = sinon.spy(overrides, 'query');
    const pool = (0, createMockPool_1.createMockPool)(overrides);
    await pool.transaction(async (transaction) => {
        await transaction.query((0, src_1.sql) `
      SELECT ${'foo'}
    `);
    });
    t.is(query.callCount, 1);
    t.is(query.firstCall.args[0].trim(), 'SELECT $1');
    t.deepEqual(query.firstCall.args[1], [
        'foo',
    ]);
});
(0, ava_1.default)('executes a mock transaction (nested)', async (t) => {
    const overrides = {
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
            ]);
        },
    };
    const query = sinon.spy(overrides, 'query');
    const pool = (0, createMockPool_1.createMockPool)(overrides);
    await pool.transaction(async (transaction0) => {
        await transaction0.transaction(async (transaction1) => {
            await transaction1.query((0, src_1.sql) `
        SELECT ${'foo'}
      `);
        });
    });
    t.is(query.callCount, 1);
    t.is(query.firstCall.args[0].trim(), 'SELECT $1');
    t.deepEqual(query.firstCall.args[1], [
        'foo',
    ]);
});
(0, ava_1.default)('enforces result assertions', async (t) => {
    const pool = (0, createMockPool_1.createMockPool)({
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
                {
                    foo: 'bar',
                },
            ]);
        },
    });
    const error = await t.throwsAsync(pool.one((0, src_1.sql) `SELECT 1`));
    t.true(error instanceof src_1.DataIntegrityError);
});
(0, ava_1.default)('enforces result normalization', async (t) => {
    const pool = (0, createMockPool_1.createMockPool)({
        query: async () => {
            return (0, createMockQueryResult_1.createMockQueryResult)([
                {
                    foo: 'bar',
                },
            ]);
        },
    });
    t.is(await pool.oneFirst((0, src_1.sql) `SELECT 1`), 'bar');
});