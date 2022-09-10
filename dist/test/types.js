"use strict";
/**
 * Functions in this file are never actually run - they are purely
 * a type-level tests to ensure the typings don't regress.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryMethods = void 0;
const expect_type_1 = require("expect-type");
const zod_1 = require("zod");
const src_1 = require("../src");
const ZodRow = zod_1.z.object({
    bar: zod_1.z.boolean(),
    foo: zod_1.z.string(),
});
const queryMethods = async () => {
    const client = await (0, src_1.createPool)('');
    // parser
    const parser = src_1.sql.type(ZodRow) ``.parser;
    (0, expect_type_1.expectTypeOf)(parser).toEqualTypeOf();
    // any
    const any = await client.any((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(any).toEqualTypeOf();
    const anyTyped = await client.any((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(anyTyped).toEqualTypeOf();
    const anyTypedQuery = await client.any((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(anyTypedQuery).toEqualTypeOf();
    const anyZodTypedQuery = await client.any(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(anyZodTypedQuery).toEqualTypeOf();
    // anyFirst
    const anyFirst = await client.anyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(anyFirst).toEqualTypeOf();
    const anyFirstTyped = await client.anyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(anyFirstTyped).toEqualTypeOf();
    const anyFirstTypedQuery = await client.anyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(anyFirstTypedQuery).toEqualTypeOf();
    const anyFirstZodTypedQuery = await client.anyFirst(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(anyFirstZodTypedQuery).toEqualTypeOf();
    // many
    const many = await client.many((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(many).toEqualTypeOf();
    const manyTyped = await client.many((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(manyTyped).toEqualTypeOf();
    const manyTypedQuery = await client.many((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(manyTypedQuery).toEqualTypeOf();
    const manyZodTypedQuery = await client.many(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(manyZodTypedQuery).toEqualTypeOf();
    // manyFirst
    const manyFirst = await client.manyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(manyFirst).toEqualTypeOf();
    const manyFirstTyped = await client.manyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(manyFirstTyped).toEqualTypeOf();
    const manyFirstTypedQuery = await client.manyFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(manyFirstTypedQuery).toEqualTypeOf();
    const manyFirstZodTypedQuery = await client.manyFirst(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(manyFirstZodTypedQuery).toEqualTypeOf();
    // maybeOne
    const maybeOne = await client.maybeOne((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOne).toEqualTypeOf();
    const maybeOneTyped = await client.maybeOne((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneTyped).toEqualTypeOf();
    const maybeOneTypedQuery = await client.maybeOne((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneTypedQuery).toEqualTypeOf();
    const maybeOneZodTypedQuery = await client.maybeOne(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneZodTypedQuery).toEqualTypeOf();
    // maybeOneFirst
    const maybeOneFirst = await client.maybeOneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneFirst).toEqualTypeOf();
    const maybeOneFirstTyped = await client.maybeOneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneFirstTyped).toEqualTypeOf();
    const maybeOneFirstTypedQuery = await client.maybeOneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneFirstTypedQuery).toEqualTypeOf();
    const maybeOneFirstZodTypedQuery = await client.maybeOneFirst(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(maybeOneFirstZodTypedQuery).toEqualTypeOf();
    // one
    const one = await client.one((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(one).toEqualTypeOf();
    const oneTyped = await client.one((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(oneTyped).toEqualTypeOf();
    const oneTypedQuery = await client.one((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(oneTypedQuery).toEqualTypeOf();
    const oneZodTypedQuery = await client.one(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(oneZodTypedQuery).toEqualTypeOf();
    // oneFirst
    const oneFirst = await client.oneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(oneFirst).toEqualTypeOf();
    const oneFirstTyped = await client.oneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(oneFirstTyped).toEqualTypeOf();
    const oneFirstTypedQuery = await client.oneFirst((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(oneFirstTypedQuery).toEqualTypeOf();
    const oneFirstZodTypedQuery = await client.oneFirst(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(oneFirstZodTypedQuery).toEqualTypeOf();
    // query
    const query = await client.query((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(query).toMatchTypeOf();
    const queryTyped = await client.query((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(queryTyped).toMatchTypeOf();
    const queryTypedQuery = await client.query((0, src_1.sql) ``);
    (0, expect_type_1.expectTypeOf)(queryTypedQuery).toMatchTypeOf();
    const queryZodTypedQuery = await client.query(src_1.sql.type(ZodRow) ``);
    (0, expect_type_1.expectTypeOf)(queryZodTypedQuery).toMatchTypeOf();
    const FooBarRow = zod_1.z.object({
        x: zod_1.z.string(),
        y: zod_1.z.number(),
    });
    (0, expect_type_1.expectTypeOf)(await client.one(src_1.sql.type(FooBarRow) `select 'x' x, 123 y`)).toEqualTypeOf();
    (0, expect_type_1.expectTypeOf)(await client.any(src_1.sql.type(FooBarRow) `select 'x' x, 123 y`)).toEqualTypeOf();
};
exports.queryMethods = queryMethods;
