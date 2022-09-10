"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const src_1 = require("../../../src");
const createIntegrationTests_1 = require("../../helpers/createIntegrationTests");
const { test, } = (0, createIntegrationTests_1.createTestRunner)(pg_1.Pool, 'pg');
(0, createIntegrationTests_1.createIntegrationTests)(test, pg_1.Pool);
test('returns expected query result object (NOTICE)', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn, {
        PgPool: pg_1.Pool,
    });
    await pool.query((0, src_1.sql) `
    CREATE OR REPLACE FUNCTION test_notice
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
      RAISE LOG '4. TEST LOG [%]',v_test;
      RAISE NOTICE '5. TEST NOTICE [%]',v_test;

      RETURN TRUE;
    END;
    $$;
  `);
    const result = await pool.query((0, src_1.sql) `SELECT * FROM test_notice(${10});`);
    t.is(result.notices.length, 4);
    await pool.end();
});
test('streams rows', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn);
    await pool.query((0, src_1.sql) `
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);
    const messages = [];
    await pool.stream((0, src_1.sql) `
    SELECT name
    FROM person
  `, (stream) => {
        stream.on('data', (datum) => {
            messages.push(datum);
        });
    });
    t.deepEqual(messages, [
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'foo',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'bar',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'baz',
            },
        },
    ]);
    await pool.end();
});
test('streams rows with different batchSize', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn);
    await pool.query((0, src_1.sql) `
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);
    const messages = [];
    await pool.stream((0, src_1.sql) `
    SELECT name
    FROM person
  `, (stream) => {
        stream.on('data', (datum) => {
            messages.push(datum);
        });
    }, {
        batchSize: 1,
    });
    t.deepEqual(messages, [
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'foo',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'bar',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'baz',
            },
        },
    ]);
    await pool.end();
});
test('applies type parsers to streamed rows', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn, {
        typeParsers: [
            {
                name: 'date',
                parse: (value) => {
                    return value === null ? value : new Date(value + ' 00:00').getFullYear();
                },
            },
        ],
    });
    await pool.query((0, src_1.sql) `
    INSERT INTO person
      (name, birth_date)
    VALUES
      ('foo', '1990-01-01'),
      ('bar', '1991-01-01'),
      ('baz', '1992-01-01')
  `);
    const messages = [];
    await pool.stream((0, src_1.sql) `
    SELECT birth_date
    FROM person
    ORDER BY birth_date ASC
  `, (stream) => {
        stream.on('data', (datum) => {
            messages.push(datum);
        });
    });
    t.deepEqual(messages, [
        {
            fields: [
                {
                    dataTypeId: 1082,
                    name: 'birth_date',
                },
            ],
            row: {
                birth_date: 1990,
            },
        },
        {
            fields: [
                {
                    dataTypeId: 1082,
                    name: 'birth_date',
                },
            ],
            row: {
                birth_date: 1991,
            },
        },
        {
            fields: [
                {
                    dataTypeId: 1082,
                    name: 'birth_date',
                },
            ],
            row: {
                birth_date: 1992,
            },
        },
    ]);
    await pool.end();
});
test('streams over a transaction', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn);
    await pool.query((0, src_1.sql) `
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);
    const messages = [];
    await pool.transaction(async (transaction) => {
        await transaction.stream((0, src_1.sql) `
      SELECT name
      FROM person
    `, (stream) => {
            stream.on('data', (datum) => {
                messages.push(datum);
            });
        });
    });
    t.deepEqual(messages, [
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'foo',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'bar',
            },
        },
        {
            fields: [
                {
                    dataTypeId: 25,
                    name: 'name',
                },
            ],
            row: {
                name: 'baz',
            },
        },
    ]);
    await pool.end();
});
test('copies from binary stream', async (t) => {
    const pool = await (0, src_1.createPool)(t.context.dsn);
    await pool.copyFromBinary((0, src_1.sql) `
      COPY person
      (
        name
      )
      FROM STDIN BINARY
    `, [
        [
            'foo',
        ],
        [
            'bar',
        ],
        [
            'baz',
        ],
    ], [
        'text',
    ]);
    t.deepEqual(await pool.anyFirst((0, src_1.sql) `
    SELECT name
    FROM person
  `), [
        'foo',
        'bar',
        'baz',
    ]);
    await pool.end();
});
