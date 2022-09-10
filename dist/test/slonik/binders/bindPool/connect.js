"use strict";
/* eslint-disable ava/max-asserts */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const createSqlTag_1 = require("../../../../src/factories/createSqlTag");
const createPool_1 = require("../../../helpers/createPool");
const sql = (0, createSqlTag_1.createSqlTag)();
(0, ava_1.default)('release connection after promise is resolved (implicit connection)', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    await pool.query(sql `SELECT 1`);
    t.is(pool.connectSpy.callCount, 1);
    t.is(pool.releaseSpy.callCount, 1);
    t.is(pool.removeSpy.callCount, 0);
});
(0, ava_1.default)('ends connection after promise is rejected', async (t) => {
    const pool = await (0, createPool_1.createPool)();
    await t.throwsAsync(pool.connect(async () => {
        return await Promise.reject(new Error('foo'));
    }));
    t.is(pool.connectSpy.callCount, 1);
    t.is(pool.releaseSpy.callCount, 1);
    t.true(pool.releaseSpy.calledWith(true));
});
(0, ava_1.default)('does not connect if `beforePoolConnection` throws an error', async (t) => {
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                beforePoolConnection: async () => {
                    throw new Error('foo');
                },
            },
        ],
    });
    await t.throwsAsync(pool.connect(async () => {
        return null;
    }));
    t.is(pool.connectSpy.callCount, 0);
    t.is(pool.releaseSpy.callCount, 0);
    t.is(pool.removeSpy.callCount, 0);
});
(0, ava_1.default)('ends connection if `afterPoolConnection` throws an error', async (t) => {
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                afterPoolConnection: async () => {
                    throw new Error('foo');
                },
            },
        ],
    });
    await t.throwsAsync(pool.connect(async () => {
        return null;
    }));
    t.is(pool.connectSpy.callCount, 1);
    t.is(pool.releaseSpy.callCount, 1);
    t.true(pool.releaseSpy.calledWith(true));
});
(0, ava_1.default)('ends connection if `beforePoolConnectionRelease` throws an error', async (t) => {
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                afterPoolConnection: async () => {
                    throw new Error('foo');
                },
            },
        ],
    });
    await t.throwsAsync(pool.connect(async () => {
        return null;
    }));
    t.is(pool.connectSpy.callCount, 1);
    t.is(pool.releaseSpy.callCount, 1);
    t.true(pool.releaseSpy.calledWith(true));
});
(0, ava_1.default)('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a new connection (IMPLICIT_QUERY)', async (t) => {
    const pool0 = await (0, createPool_1.createPool)();
    const pool1 = await (0, createPool_1.createPool)({
        interceptors: [
            {
                beforePoolConnection: () => {
                    return pool0;
                },
            },
        ],
    });
    await pool1.query(sql `SELECT 1`);
    t.is(pool0.connectSpy.callCount, 1);
    t.is(pool0.releaseSpy.callCount, 1);
    t.is(pool0.removeSpy.callCount, 0);
    t.is(pool1.connectSpy.callCount, 0);
    t.is(pool1.releaseSpy.callCount, 0);
    t.is(pool1.removeSpy.callCount, 0);
});
(0, ava_1.default)('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (IMPLICIT_TRANSACTION)', async (t) => {
    const pool0 = await (0, createPool_1.createPool)();
    const pool1 = await (0, createPool_1.createPool)({
        interceptors: [
            {
                beforePoolConnection: () => {
                    return pool0;
                },
            },
        ],
    });
    await pool1.transaction(async (connection) => {
        return await connection.query(sql `SELECT 1`);
    });
    t.is(pool0.connectSpy.callCount, 1);
    t.is(pool0.releaseSpy.callCount, 1);
    t.is(pool0.removeSpy.callCount, 0);
    t.is(pool1.connectSpy.callCount, 0);
    t.is(pool1.releaseSpy.callCount, 0);
    t.is(pool1.removeSpy.callCount, 0);
});
(0, ava_1.default)('if `beforePoolConnection` returns pool object, then the returned pool object is used to create a connection (EXPLICIT)', async (t) => {
    const pool0 = await (0, createPool_1.createPool)();
    const pool1 = await (0, createPool_1.createPool)({
        interceptors: [
            {
                beforePoolConnection: () => {
                    return pool0;
                },
            },
        ],
    });
    await pool1.connect(async (connection) => {
        return await connection.query(sql `SELECT 1`);
    });
    t.is(pool0.connectSpy.callCount, 1);
    t.is(pool0.releaseSpy.callCount, 1);
    t.is(pool0.removeSpy.callCount, 0);
    t.is(pool1.connectSpy.callCount, 0);
    t.is(pool1.releaseSpy.callCount, 0);
    t.is(pool1.removeSpy.callCount, 0);
});
(0, ava_1.default)('if `beforePoolConnection` returns null, then the current pool object is used to create a connection', async (t) => {
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                beforePoolConnection: () => {
                    return null;
                },
            },
        ],
    });
    await pool.query(sql `SELECT 1`);
    t.is(pool.connectSpy.callCount, 1);
    t.is(pool.releaseSpy.callCount, 1);
    t.is(pool.removeSpy.callCount, 0);
});