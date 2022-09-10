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
const createSqlTag_1 = require("../../../../../src/factories/createSqlTag");
const createPool_1 = require("../../../../helpers/createPool");
const sql = (0, createSqlTag_1.createSqlTag)();
(0, ava_1.default)('`afterPoolConnection` is called after `connect`', async (t) => {
    const afterPoolConnection = sinon.stub();
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {},
        ],
    });
    await pool.connect(async () => {
        return 'foo';
    });
    t.true(pool.connectSpy.calledBefore(afterPoolConnection));
});
(0, ava_1.default)('`connectionType` is "EXPLICIT" when `connect` is used to create connection', async (t) => {
    const afterPoolConnection = sinon.stub();
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                afterPoolConnection,
            },
        ],
    });
    await pool.connect(async () => {
        return 'foo';
    });
    t.is(afterPoolConnection.firstCall.args[0].connectionType, 'EXPLICIT');
});
(0, ava_1.default)('`connectionType` is "IMPLICIT_QUERY" when a query method is used to create a connection', async (t) => {
    const afterPoolConnection = sinon.stub();
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                afterPoolConnection,
            },
        ],
    });
    await pool.query(sql `SELECT 1`);
    t.is(afterPoolConnection.firstCall.args[0].connectionType, 'IMPLICIT_QUERY');
});
(0, ava_1.default)('`connectionType` is "IMPLICIT_TRANSACTION" when `transaction` is used to create a connection', async (t) => {
    const afterPoolConnection = sinon.stub();
    const pool = await (0, createPool_1.createPool)({
        interceptors: [
            {
                afterPoolConnection,
            },
        ],
    });
    await pool.transaction(async () => {
        return 'foo';
    });
    t.is(afterPoolConnection.firstCall.args[0].connectionType, 'IMPLICIT_TRANSACTION');
});