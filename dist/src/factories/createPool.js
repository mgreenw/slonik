"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPool = void 0;
const pg_1 = require("pg");
const serialize_error_1 = require("serialize-error");
const Logger_1 = require("../Logger");
const bindPool_1 = require("../binders/bindPool");
const routines_1 = require("../routines");
const state_1 = require("../state");
const utilities_1 = require("../utilities");
const createClientConfiguration_1 = require("./createClientConfiguration");
const createPoolConfiguration_1 = require("./createPoolConfiguration");
/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
const createPool = async (connectionUri, clientConfigurationInput) => {
    const clientConfiguration = (0, createClientConfiguration_1.createClientConfiguration)(clientConfigurationInput);
    const poolId = (0, utilities_1.createUid)();
    const poolLog = Logger_1.Logger.child({
        poolId,
    });
    const poolConfiguration = (0, createPoolConfiguration_1.createPoolConfiguration)(connectionUri, clientConfiguration);
    let Pool = clientConfiguration.PgPool;
    if (!Pool) {
        Pool = pg_1.Pool;
    }
    if (!Pool) {
        throw new Error('Unexpected state.');
    }
    const setupClient = new pg_1.Client({
        connectionTimeoutMillis: poolConfiguration.connectionTimeoutMillis,
        database: poolConfiguration.database,
        host: poolConfiguration.host,
        password: poolConfiguration.password,
        port: poolConfiguration.port,
        ssl: poolConfiguration.ssl,
        user: poolConfiguration.user,
    });
    await setupClient.connect();
    const getTypeParser = await (0, routines_1.createTypeOverrides)(setupClient, clientConfiguration.typeParsers);
    await setupClient.end();
    const pool = new Pool({
        ...poolConfiguration,
        types: {
            getTypeParser,
        },
    });
    state_1.poolStateMap.set(pool, {
        ended: false,
        mock: false,
        poolId,
        typeOverrides: null,
    });
    // istanbul ignore next
    pool.on('connect', (client) => {
        client.on('error', (error) => {
            poolLog.error({
                error: (0, serialize_error_1.serializeError)(error),
            }, 'client error');
        });
        client.on('notice', (notice) => {
            poolLog.info({
                notice: {
                    level: notice.name,
                    message: notice.message,
                },
            }, 'notice message');
        });
        poolLog.debug({
            stats: {
                idleConnectionCount: pool.idleCount,
                totalConnectionCount: pool.totalCount,
                waitingRequestCount: pool.waitingCount,
            },
        }, 'created a new client connection');
    });
    // istanbul ignore next
    pool.on('acquire', () => {
        poolLog.debug({
            stats: {
                idleConnectionCount: pool.idleCount,
                totalConnectionCount: pool.totalCount,
                waitingRequestCount: pool.waitingCount,
            },
        }, 'client is checked out from the pool');
    });
    // istanbul ignore next
    pool.on('remove', () => {
        poolLog.debug({
            stats: {
                idleConnectionCount: pool.idleCount,
                totalConnectionCount: pool.totalCount,
                waitingRequestCount: pool.waitingCount,
            },
        }, 'client connection is closed and removed from the client pool');
    });
    return (0, bindPool_1.bindPool)(poolLog, pool, clientConfiguration);
};
exports.createPool = createPool;