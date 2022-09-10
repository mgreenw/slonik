"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntegrationTests = exports.createTestRunner = void 0;
const ava_1 = __importDefault(require("ava"));
const delay_1 = __importDefault(require("delay"));
const serialize_error_1 = require("serialize-error");
const zod_1 = require("zod");
const src_1 = require("../../src");
const Logger_1 = require("../../src/Logger");
const POSTGRES_DSN = (_a = process.env.POSTGRES_DSN) !== null && _a !== void 0 ? _a : 'postgres@localhost:5432';
const log = Logger_1.Logger.child({
    namespace: 'createIntegrationTests',
});
const createTestRunner = (PgPool, name) => {
    let testId = 0;
    const test = ava_1.default;
    const { beforeEach, } = test;
    const { afterEach, } = test;
    beforeEach(async (t) => {
        ++testId;
        const TEST_DATABASE_NAME = [
            'slonik_test',
            name,
            String(testId),
        ].join('_');
        t.context = {
            dsn: 'postgresql://' + POSTGRES_DSN + '/' + TEST_DATABASE_NAME,
            testDatabaseName: TEST_DATABASE_NAME,
        };
        const pool0 = await (0, src_1.createPool)('postgresql://' + POSTGRES_DSN, {
            maximumPoolSize: 1,
            PgPool,
        });
        await pool0.connect(async (connection) => {
            await connection.query((0, src_1.sql) `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE
          pid != pg_backend_pid() AND
          datname = 'slonik_test'
      `);
            await connection.query((0, src_1.sql) `DROP DATABASE IF EXISTS ${src_1.sql.identifier([
                TEST_DATABASE_NAME,
            ])}`);
            await connection.query((0, src_1.sql) `CREATE DATABASE ${src_1.sql.identifier([
                TEST_DATABASE_NAME,
            ])}`);
        });
        await pool0.end();
        const pool1 = await (0, src_1.createPool)(t.context.dsn, {
            maximumPoolSize: 1,
            PgPool,
        });
        await pool1.connect(async (connection) => {
            await connection.query((0, src_1.sql) `
        CREATE TABLE person (
          id SERIAL PRIMARY KEY,
          name text,
          birth_date date,
          payload bytea
        )
      `);
        });
        await pool1.end();
    });
    afterEach(async (t) => {
        const pool = await (0, src_1.createPool)('postgresql://' + POSTGRES_DSN, {
            maximumPoolSize: 1,
            PgPool,
        });
        try {
            await pool.connect(async (connection) => {
                await connection.query((0, src_1.sql) `
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE
            pid != pg_backend_pid() AND
            datname = 'slonik_test'
        `);
                await connection.query((0, src_1.sql) `DROP DATABASE IF EXISTS ${src_1.sql.identifier([
                    t.context.testDatabaseName,
                ])}`);
            });
        }
        catch (error) {
            log.error({
                error: (0, serialize_error_1.serializeError)(error),
            }, 'could not clean up database');
        }
        await pool.end();
    });
    return {
        test,
    };
};
exports.createTestRunner = createTestRunner;
const createIntegrationTests = (test, PgPool) => {
    test('does not allow to reuse released connection', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        let firstConnection;
        await pool.connect(async (connection) => {
            firstConnection = connection;
        });
        if (!firstConnection) {
            throw new Error('Expected connection object');
        }
        await t.throwsAsync(firstConnection.oneFirst((0, src_1.sql) `SELECT 1`));
    });
    test('validates results using zod (passes)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const result = await pool.one(src_1.sql.type(zod_1.z.object({
            foo: zod_1.z.string(),
        })) `
      SELECT 'bar' foo
    `);
        t.like(result, {
            foo: 'bar',
        });
        await pool.end();
    });
    test('validates results using zod (fails)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const error = await t.throwsAsync(pool.one(src_1.sql.type(zod_1.z.object({
            foo: zod_1.z.number(),
        })) `
      SELECT 'bar' foo
    `));
        if (!error) {
            throw new Error('Expected SchemaValidationError');
        }
        t.like(error.issues[0], {
            code: 'invalid_type',
        });
        await pool.end();
    });
    // We have to test serialization due to the use of different drivers (pg and postgres).
    test('serializes json', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const result = await pool.oneFirst((0, src_1.sql) `
      SELECT ${src_1.sql.json({
            bar: 'baz',
        })} foo
    `);
        t.like(result, {
            bar: 'baz',
        });
        await pool.end();
    });
    test('returns numerics as strings by default', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
            typeParsers: [],
        });
        const result = await pool.oneFirst((0, src_1.sql) `
      SELECT 1::numeric foo
    `);
        t.is(result, '1');
        await pool.end();
    });
    test('parses numerics as floats', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
            typeParsers: [
                (0, src_1.createNumericTypeParser)(),
            ],
        });
        const result = await pool.oneFirst((0, src_1.sql) `
      SELECT 1::numeric foo
    `);
        t.is(result, 1);
        await pool.end();
    });
    test('returns expected query result object (array bytea)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const result = await pool.query((0, src_1.sql) `
      SELECT ${src_1.sql.array([
            Buffer.from('foo'),
        ], 'bytea')} "names"
    `);
        t.deepEqual(result, {
            command: 'SELECT',
            fields: [
                {
                    dataTypeId: 1001,
                    name: 'names',
                },
            ],
            notices: [],
            rowCount: 1,
            rows: [
                {
                    names: [
                        Buffer.from('foo'),
                    ],
                },
            ],
        });
        await pool.end();
    });
    test('returns expected query result object (INSERT)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const result = await pool.query((0, src_1.sql) `
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);
        t.deepEqual(result, {
            command: 'INSERT',
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            notices: [],
            rowCount: 1,
            rows: [
                {
                    name: 'foo',
                },
            ],
        });
        await pool.end();
    });
    test('returns expected query result object (UPDATE)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);
        const result = await pool.query((0, src_1.sql) `
      UPDATE person
      SET
        name = 'bar'
      WHERE name = 'foo'
      RETURNING
        name
    `);
        t.deepEqual(result, {
            command: 'UPDATE',
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            notices: [],
            rowCount: 1,
            rows: [
                {
                    name: 'bar',
                },
            ],
        });
        await pool.end();
    });
    test('returns expected query result object (DELETE)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      INSERT INTO person
      (
        name
      )
      VALUES
      (
        'foo'
      )
      RETURNING
        name
    `);
        const result = await pool.query((0, src_1.sql) `
      DELETE FROM person
      WHERE name = 'foo'
      RETURNING
        name
    `);
        t.deepEqual(result, {
            command: 'DELETE',
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            notices: [],
            rowCount: 1,
            rows: [
                {
                    name: 'foo',
                },
            ],
        });
        await pool.end();
    });
    test('terminated backend produces BackendTerminatedError error', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const error = await t.throwsAsync(pool.connect(async (connection) => {
            const connectionPid = await connection.oneFirst((0, src_1.sql) `
        SELECT pg_backend_pid()
      `);
            setTimeout(() => {
                void pool.query((0, src_1.sql) `SELECT pg_terminate_backend(${connectionPid})`);
            }, 100);
            await connection.query((0, src_1.sql) `SELECT pg_sleep(2)`);
        }));
        t.true(error instanceof src_1.BackendTerminatedError);
        await pool.end();
    });
    test('cancelled statement produces StatementCancelledError error', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const error = await t.throwsAsync(pool.connect(async (connection) => {
            const connectionPid = await connection.oneFirst((0, src_1.sql) `
        SELECT pg_backend_pid()
      `);
            setTimeout(() => {
                void pool.query((0, src_1.sql) `SELECT pg_cancel_backend(${connectionPid})`);
            }, 100);
            await connection.query((0, src_1.sql) `SELECT pg_sleep(2)`);
        }));
        t.true(error instanceof src_1.StatementCancelledError);
        await pool.end();
    });
    test('statement cancelled because of statement_timeout produces StatementTimeoutError error', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const error = await t.throwsAsync(pool.connect(async (connection) => {
            await connection.query((0, src_1.sql) `
        SET statement_timeout=100
      `);
            await connection.query((0, src_1.sql) `SELECT pg_sleep(1)`);
        }));
        t.true(error instanceof src_1.StatementTimeoutError);
        await pool.end();
    });
    test.skip('transaction terminated while in an idle state is rejected (at the next transaction query)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.connect(async (connection) => {
            await connection.query((0, src_1.sql) `SET idle_in_transaction_session_timeout=500`);
            const error = await t.throwsAsync(connection.transaction(async (transaction) => {
                await (0, delay_1.default)(1000);
                await transaction.query((0, src_1.sql) `SELECT 1`);
            }));
            t.true(error instanceof src_1.BackendTerminatedError);
        });
        await pool.end();
    });
    test.skip('connection of transaction terminated while in an idle state is rejected (at the end of the transaction)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.connect(async (connection) => {
            await connection.query((0, src_1.sql) `SET idle_in_transaction_session_timeout=500`);
            const error = await t.throwsAsync(connection.transaction(async () => {
                await (0, delay_1.default)(1000);
            }));
            t.true(error instanceof src_1.BackendTerminatedError);
        });
        await pool.end();
    });
    test('throws an error if an attempt is made to make multiple transactions at once using the same connection', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const error = await t.throwsAsync(pool.connect(async (connection) => {
            await Promise.all([
                connection.transaction(async () => {
                    await (0, delay_1.default)(1000);
                }),
                connection.transaction(async () => {
                    await (0, delay_1.default)(1000);
                }),
                connection.transaction(async () => {
                    await (0, delay_1.default)(1000);
                }),
            ]);
        }));
        t.true(error instanceof src_1.UnexpectedStateError);
        t.is(error === null || error === void 0 ? void 0 : error.message, 'Cannot use the same connection to start a new transaction before completing the last transaction.');
        await pool.end();
    });
    test('writes and reads buffers', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const payload = 'foobarbazqux';
        await pool.query((0, src_1.sql) `
      INSERT INTO person
      (
        payload
      )
      VALUES
      (
        ${src_1.sql.binary(Buffer.from(payload))}
      )
    `);
        const result = await pool.oneFirst((0, src_1.sql) `
      SELECT payload
      FROM person
    `);
        t.is(result.toString(), payload);
        await pool.end();
    });
    test('explicit connection configuration is persisted', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            maximumPoolSize: 1,
            PgPool,
        });
        await pool.connect(async (connection) => {
            const originalStatementTimeout = await connection.oneFirst((0, src_1.sql) `SHOW statement_timeout`);
            t.not(originalStatementTimeout, '50ms');
            await connection.query((0, src_1.sql) `SET statement_timeout=50`);
            const statementTimeout = await connection.oneFirst((0, src_1.sql) `SHOW statement_timeout`);
            t.is(statementTimeout, '50ms');
        });
        await pool.end();
    });
    test('serves waiting requests', async (t) => {
        t.timeout(10000);
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            maximumPoolSize: 1,
            PgPool,
        });
        let index = 100;
        const queue = [];
        while (index--) {
            queue.push(pool.query((0, src_1.sql) `SELECT 1`));
        }
        await Promise.all(queue);
        await pool.end();
        // We are simply testing to ensure that requests in a queue
        // are assigned a connection after a preceding request is complete.
        t.true(true);
    });
    test('pool.end() resolves when there are no more connections (no connections at start)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        await pool.end();
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: true,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
    });
    test('pool.end() resolves when there are no more connections (implicit connection)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        await pool.query((0, src_1.sql) `
      SELECT 1
    `);
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 1,
            waitingClientCount: 0,
        });
        await pool.end();
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: true,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
    });
    test('pool.end() resolves when there are no more connections (explicit connection holding pool alive)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        void pool.connect(async () => {
            await (0, delay_1.default)(500);
        });
        await (0, delay_1.default)(100);
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 1,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        await pool.end();
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: true,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
    });
    test('pool.end() resolves when there are no more connections (terminates idle connections)', async (t) => {
        t.timeout(1000);
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            idleTimeout: 5000,
            maximumPoolSize: 5,
            PgPool,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        await Promise.all([
            pool.query((0, src_1.sql) `
        SELECT 1
      `),
            pool.query((0, src_1.sql) `
        SELECT 1
      `),
            pool.query((0, src_1.sql) `
        SELECT 1
      `),
            pool.query((0, src_1.sql) `
        SELECT 1
      `),
            pool.query((0, src_1.sql) `
        SELECT 1
      `),
        ]);
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 5,
            waitingClientCount: 0,
        });
        await pool.end();
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: true,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
    });
    test.skip('idle transactions are terminated after `idleInTransactionSessionTimeout`', async (t) => {
        t.timeout(10000);
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            idleInTransactionSessionTimeout: 1000,
            maximumPoolSize: 5,
            PgPool,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        const error = await t.throwsAsync(pool.transaction(async () => {
            await (0, delay_1.default)(2000);
        }));
        t.true(error instanceof src_1.BackendTerminatedError);
        await pool.end();
    });
    // Skipping test because of a bug in node-postgres.
    // @see https://github.com/brianc/node-postgres/issues/2103
    test.skip('statements are cancelled after `statementTimeout`', async (t) => {
        t.timeout(5000);
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            maximumPoolSize: 5,
            PgPool,
            statementTimeout: 1000,
        });
        t.deepEqual(pool.getPoolState(), {
            activeConnectionCount: 0,
            ended: false,
            idleConnectionCount: 0,
            waitingClientCount: 0,
        });
        const error = await t.throwsAsync(pool.query((0, src_1.sql) `SELECT pg_sleep(2000)`));
        t.true(error instanceof src_1.StatementTimeoutError);
        await pool.end();
    });
    test.serial.skip('retries failing transactions (deadlock)', async (t) => {
        t.timeout(2000);
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const firstPersonId = await pool.oneFirst((0, src_1.sql) `
      INSERT INTO person (name)
      VALUES ('foo')
      RETURNING id
    `);
        const secondPersonId = await pool.oneFirst((0, src_1.sql) `
      INSERT INTO person (name)
      VALUES ('bar')
      RETURNING id
    `);
        let transactionCount = 0;
        let resolveDeadlock;
        const deadlock = new Promise((resolve) => {
            resolveDeadlock = resolve;
        });
        const updatePerson = async (firstUpdateId, firstUpdateName, secondUpdateId, secondUpdateName, delayDeadlock) => {
            await pool.transaction(async (transaction) => {
                await transaction.query((0, src_1.sql) `
          SET deadlock_timeout='1s'
        `);
                await transaction.query((0, src_1.sql) `
          UPDATE person
          SET name = ${firstUpdateName}
          WHERE id = ${firstUpdateId}
        `);
                ++transactionCount;
                if (transactionCount === 2) {
                    resolveDeadlock();
                }
                await (0, delay_1.default)(delayDeadlock);
                await deadlock;
                await transaction.query((0, src_1.sql) `
          UPDATE person
          SET name = ${secondUpdateName}
          WHERE id = ${secondUpdateId}
        `);
            });
        };
        await t.notThrowsAsync(Promise.all([
            updatePerson(firstPersonId, 'foo 0', secondPersonId, 'foo 1', 50),
            updatePerson(secondPersonId, 'bar 0', firstPersonId, 'bar 1', 0),
        ]));
        t.is(await pool.oneFirst((0, src_1.sql) `
        SELECT name
        FROM person
        WHERE id = ${firstPersonId}
      `), 'bar 1');
        t.is(await pool.oneFirst((0, src_1.sql) `
        SELECT name
        FROM person
        WHERE id = ${secondPersonId}
      `), 'bar 0');
        await pool.end();
    });
    test('does not throw an error if running a query with array_agg on dates', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      INSERT INTO person
      (
        name,
        birth_date
      )
      VALUES
        ('foo', '2020-01-01'),
        ('foo', '2020-01-02'),
        ('bar', '2020-01-03')
    `);
        const result = await pool.query((0, src_1.sql) `
      SELECT
        p1.name,
        array_agg(p1.birth_date) birth_dates
      FROM person p1
      GROUP BY p1.name
    `);
        t.deepEqual(result, {
            command: 'SELECT',
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
                {
                    dataTypeId: 1182,
                    name: 'birth_dates',
                },
            ],
            notices: [],
            rowCount: 2,
            rows: [
                {
                    birth_dates: [
                        '2020-01-03',
                    ],
                    name: 'bar',
                },
                {
                    birth_dates: [
                        '2020-01-01',
                        '2020-01-02',
                    ],
                    name: 'foo',
                },
            ],
        });
        await pool.end();
    });
    test('returns true if returns rows', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        t.true(await pool.exists((0, src_1.sql) `
        SELECT LIMIT 1
      `));
        await pool.end();
    });
    test('returns false if returns rows', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        t.false(await pool.exists((0, src_1.sql) `
        SELECT LIMIT 0
      `));
        await pool.end();
    });
    test('returns expected query result object (SELECT)', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        const result = await pool.query((0, src_1.sql) `
      SELECT 1 "name"
    `);
        t.deepEqual(result, {
            command: 'SELECT',
            fields: [
                {
                    dataTypeId: 23,
                    name: 'name',
                },
            ],
            notices: [],
            rowCount: 1,
            rows: [
                {
                    name: 1,
                },
            ],
        });
        await pool.end();
    });
    test('throw error with notices', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      CREATE OR REPLACE FUNCTION error_notice
        (
          v_test INTEGER
        ) RETURNS BOOLEAN
        LANGUAGE plpgsql
      AS
      $$
      BEGIN

        RAISE NOTICE '1. TEST NOTICE [%]',v_test;
        RAISE NOTICE '2. TEST NOTICE [%]',v_test;
        RAISE NOTICE '3. TEST NOTICE [%]',v_test;
        RAISE WARNING '4. TEST LOG [%]',v_test;
        RAISE NOTICE '5. TEST NOTICE [%]',v_test;
        RAISE EXCEPTION 'THIS IS AN ERROR';
      END;
      $$;
    `);
        try {
            await pool.query((0, src_1.sql) `SELECT * FROM error_notice(${10});`);
        }
        catch (error) {
            if (error === null || error === void 0 ? void 0 : error.notices) {
                t.is(error.notices.length, 5);
            }
        }
        await pool.end();
    });
    test('error messages include original pg error', async (t) => {
        var _a;
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      INSERT INTO person (id)
      VALUES (1)
    `);
        const error = await t.throwsAsync(async () => {
            return await pool.query((0, src_1.sql) `
        INSERT INTO person (id)
        VALUES (1)
      `);
        });
        t.is(error === null || error === void 0 ? void 0 : error.message, 
        // @ts-expect-error
        'Query violates a unique integrity constraint. ' + String((_a = error === null || error === void 0 ? void 0 : error.originalError) === null || _a === void 0 ? void 0 : _a.message));
        await pool.end();
    });
    test('Tuple moved to another partition due to concurrent update error handled', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
            queryRetryLimit: 0,
        });
        await pool.connect(async (connection) => {
            await connection.query((0, src_1.sql) `CREATE TABLE foo (a int, b text) PARTITION BY LIST(a)`);
            await connection.query((0, src_1.sql) `CREATE TABLE foo1 PARTITION OF foo FOR VALUES IN (1)`);
            await connection.query((0, src_1.sql) `CREATE TABLE foo2 PARTITION OF foo FOR VALUES IN (2)`);
            await connection.query((0, src_1.sql) `INSERT INTO foo VALUES (1, 'ABC')`);
        });
        await pool.connect(async (connection1) => {
            await pool.connect(async (connection2) => {
                await connection1.query((0, src_1.sql) `BEGIN`);
                await connection2.query((0, src_1.sql) `BEGIN`);
                await connection1.query((0, src_1.sql) `UPDATE foo SET a = 2 WHERE a = 1`);
                connection2.query((0, src_1.sql) `UPDATE foo SET b = 'XYZ'`).catch((error) => {
                    var _a;
                    t.is(error.message, 'Tuple moved to another partition due to concurrent update. ' + String((_a = error === null || error === void 0 ? void 0 : error.originalError) === null || _a === void 0 ? void 0 : _a.message));
                    t.true(error instanceof src_1.TupleMovedToAnotherPartitionError);
                });
                // Ensures that query is processed before concurrent commit is called.
                await (0, delay_1.default)(1000);
                await connection1.query((0, src_1.sql) `COMMIT`);
                await connection2.query((0, src_1.sql) `COMMIT`);
            });
        });
        await pool.end();
    });
    test('throws InvalidInputError in case of invalid bound value', async (t) => {
        const pool = await (0, src_1.createPool)(t.context.dsn, {
            PgPool,
        });
        await pool.query((0, src_1.sql) `
      CREATE TABLE invalid_input_error_test (
        id uuid NOT NULL PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'
      );
    `);
        const error = await t.throwsAsync(pool.query((0, src_1.sql) `SELECT * FROM invalid_input_error_test where id = '1';`));
        t.true(error instanceof src_1.InvalidInputError);
    });
};
exports.createIntegrationTests = createIntegrationTests;