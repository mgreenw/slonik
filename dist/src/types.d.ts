/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { type Readable, type ReadableOptions } from 'stream';
import { type ConnectionOptions as TlsConnectionOptions } from 'tls';
import { type PoolConfig, type Pool as PgPool, type PoolClient as PgPoolClient } from 'pg';
import { type NoticeMessage as Notice } from 'pg-protocol/dist/messages';
import { type Logger } from 'roarr';
import { type z, type ZodTypeAny } from 'zod';
import { type SlonikError } from './errors';
import type * as tokens from './tokens';
/**
 * @see https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS
 */
export declare type ConnectionOptions = {
    applicationName?: string;
    databaseName?: string;
    host?: string;
    password?: string;
    port?: number;
    sslMode?: 'disable' | 'no-verify' | 'require';
    username?: string;
};
/**
 * "string" type covers all type name identifiers – the literal values are added only to assist developer
 * experience with auto suggestions for commonly used type name identifiers.
 */
export declare type TypeNameIdentifier = string | 'bool' | 'bytea' | 'float4' | 'float8' | 'int2' | 'int4' | 'int8' | 'json' | 'text' | 'timestamptz' | 'uuid';
export declare type SerializableValue = boolean | number | string | readonly SerializableValue[] | {
    [key: string]: SerializableValue | undefined;
} | null;
export declare type QueryId = string;
export declare type MaybePromise<T> = Promise<T> | T;
export declare type StreamHandler = (stream: Readable) => void;
export declare type Connection = 'EXPLICIT' | 'IMPLICIT_QUERY' | 'IMPLICIT_TRANSACTION';
export declare type Field = {
    readonly dataTypeId: number;
    readonly name: string;
};
export declare type QueryResult<T> = {
    readonly command: 'COPY' | 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE';
    readonly fields: readonly Field[];
    readonly notices: readonly Notice[];
    readonly rowCount: number;
    readonly rows: readonly T[];
};
export declare type ClientConfiguration = {
    /**
     * Override the underlying PostgreSQL driver. *
     */
    readonly PgPool?: new (poolConfig: PoolConfig) => PgPool;
    /**
     * Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: true)
     */
    readonly captureStackTrace: boolean;
    /**
     * Number of times to retry establishing a new connection. (Default: 3)
     */
    readonly connectionRetryLimit: number;
    /**
     * Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000)
     */
    readonly connectionTimeout: number | 'DISABLE_TIMEOUT';
    /**
     * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
     */
    readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT';
    /**
     * Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
     */
    readonly idleTimeout: number | 'DISABLE_TIMEOUT';
    /**
     * An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
     */
    readonly interceptors: readonly Interceptor[];
    /**
     * Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
     */
    readonly maximumPoolSize: number;
    /**
     * Number of times a query failing with Transaction Rollback class error, that doesn't belong to a transaction, is retried. (Default: 5)
     */
    readonly queryRetryLimit: number;
    /**
     * tls.connect options *
     */
    readonly ssl?: TlsConnectionOptions;
    /**
     * Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
     */
    readonly statementTimeout: number | 'DISABLE_TIMEOUT';
    /**
     * Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
     */
    readonly transactionRetryLimit: number;
    /**
     * An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
     */
    readonly typeParsers: readonly TypeParser[];
};
export declare type ClientConfigurationInput = Partial<ClientConfiguration>;
export declare type QueryStreamConfig = ReadableOptions & {
    batchSize?: number;
};
export declare type StreamFunction = (sql: TaggedTemplateLiteralInvocation, streamHandler: StreamHandler, config?: QueryStreamConfig) => Promise<Record<string, unknown> | null>;
export declare type QueryCopyFromBinaryFunction = (streamQuery: TaggedTemplateLiteralInvocation, tupleList: ReadonlyArray<readonly any[]>, columnTypes: readonly TypeNameIdentifier[]) => Promise<Record<string, unknown> | null>;
export declare type CommonQueryMethods = {
    readonly any: QueryAnyFunction;
    readonly anyFirst: QueryAnyFirstFunction;
    readonly exists: QueryExistsFunction;
    readonly many: QueryManyFunction;
    readonly manyFirst: QueryManyFirstFunction;
    readonly maybeOne: QueryMaybeOneFunction;
    readonly maybeOneFirst: QueryMaybeOneFirstFunction;
    readonly one: QueryOneFunction;
    readonly oneFirst: QueryOneFirstFunction;
    readonly query: QueryFunction;
    readonly transaction: <T>(handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>;
};
export declare type DatabaseTransactionConnection = CommonQueryMethods & {
    readonly stream: StreamFunction;
};
export declare type TransactionFunction<T> = (connection: DatabaseTransactionConnection) => Promise<T>;
export declare type DatabasePoolConnection = CommonQueryMethods & {
    readonly copyFromBinary: QueryCopyFromBinaryFunction;
    readonly stream: StreamFunction;
};
export declare type ConnectionRoutine<T> = (connection: DatabasePoolConnection) => Promise<T>;
export declare type PoolState = {
    readonly activeConnectionCount: number;
    readonly ended: boolean;
    readonly idleConnectionCount: number;
    readonly waitingClientCount: number;
};
export declare type DatabasePool = CommonQueryMethods & {
    readonly configuration: ClientConfiguration;
    readonly connect: <T>(connectionRoutine: ConnectionRoutine<T>) => Promise<T>;
    readonly copyFromBinary: QueryCopyFromBinaryFunction;
    readonly end: () => Promise<void>;
    readonly getPoolState: () => PoolState;
    readonly stream: StreamFunction;
};
export declare type DatabaseConnection = DatabasePool | DatabasePoolConnection;
export declare type QueryResultRowColumn = PrimitiveValueExpression;
export declare type QueryResultRow = Record<string, PrimitiveValueExpression>;
export declare type Query = {
    readonly sql: string;
    readonly values: readonly PrimitiveValueExpression[];
};
export declare type SqlFragment = {
    readonly sql: string;
    readonly values: readonly PrimitiveValueExpression[];
};
/**
 * @property name Value of "pg_type"."typname" (e.g. "int8", "timestamp", "timestamptz").
 */
export declare type TypeParser<T = unknown> = {
    readonly name: string;
    readonly parse: (value: string) => T;
};
/**
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 * @property query The query that is initiating the connection.
 */
export declare type PoolContext = {
    readonly log: Logger;
    readonly poolId: string;
    readonly query: TaggedTemplateLiteralInvocation | null;
};
/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound connection context parameters.
 * @property poolId Unique connection pool ID.
 */
export declare type ConnectionContext = {
    readonly connectionId: string;
    readonly connectionType: Connection;
    readonly log: Logger;
    readonly poolId: string;
};
declare type CallSite = {
    readonly columnNumber: number;
    readonly fileName: string | null;
    readonly functionName: string | null;
    readonly lineNumber: number;
};
export declare type IntervalInput = {
    days?: number;
    hours?: number;
    minutes?: number;
    months?: number;
    seconds?: number;
    weeks?: number;
    years?: number;
};
/**
 * @property connectionId Unique connection ID.
 * @property log Instance of Roarr logger with bound query context parameters.
 * @property originalQuery A copy of the query before `transformQuery` middleware.
 * @property poolId Unique connection pool ID.
 * @property queryId Unique query ID.
 * @property queryInputTime `process.hrtime.bigint()` for when query was received.
 * @property sandbox Object used by interceptors to assign interceptor-specific, query-specific context.
 * @property transactionId Unique transaction ID.
 */
export declare type QueryContext = {
    readonly connectionId: string;
    readonly log: Logger;
    readonly originalQuery: Query;
    readonly poolId: string;
    readonly queryId: QueryId;
    readonly queryInputTime: bigint | number;
    readonly sandbox: Record<string, unknown>;
    readonly stackTrace: readonly CallSite[] | null;
    readonly transactionId: string | null;
};
export declare type ArraySqlToken = {
    readonly memberType: SqlToken | TypeNameIdentifier;
    readonly type: typeof tokens.ArrayToken;
    readonly values: readonly PrimitiveValueExpression[];
};
export declare type BinarySqlToken = {
    readonly data: Buffer;
    readonly type: typeof tokens.BinaryToken;
};
export declare type DateSqlToken = {
    readonly date: Date;
    readonly type: typeof tokens.DateToken;
};
export declare type IdentifierSqlToken = {
    readonly names: readonly string[];
    readonly type: typeof tokens.IdentifierToken;
};
export declare type IntervalSqlToken = {
    readonly interval: IntervalInput;
    readonly type: typeof tokens.IntervalToken;
};
export declare type ListSqlToken = {
    readonly glue: SqlSqlToken;
    readonly members: readonly ValueExpression[];
    readonly type: typeof tokens.ListToken;
};
export declare type JsonBinarySqlToken = {
    readonly type: typeof tokens.JsonBinaryToken;
    readonly value: SerializableValue;
};
export declare type JsonSqlToken = {
    readonly type: typeof tokens.JsonToken;
    readonly value: SerializableValue;
};
export declare type SqlSqlToken<T extends MixedRow = ZodTypeAny> = {
    readonly parser: T extends ZodTypeAny ? T : never;
    readonly sql: string;
    readonly type: typeof tokens.SqlToken;
    readonly values: readonly PrimitiveValueExpression[];
};
export declare type TimestampSqlToken = {
    readonly date: Date;
    readonly type: typeof tokens.TimestampToken;
};
export declare type UnnestSqlToken = {
    readonly columnTypes: Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>;
    readonly tuples: ReadonlyArray<readonly ValueExpression[]>;
    readonly type: typeof tokens.UnnestToken;
};
declare type AnySqlSqlToken = SqlSqlToken<any>;
export declare type PrimitiveValueExpression = Buffer | boolean | number | string | readonly PrimitiveValueExpression[] | null;
export declare type SqlToken = ArraySqlToken | BinarySqlToken | DateSqlToken | IdentifierSqlToken | IntervalSqlToken | JsonBinarySqlToken | JsonSqlToken | ListSqlToken | SqlSqlToken | TimestampSqlToken | UnnestSqlToken;
export declare type ValueExpression = PrimitiveValueExpression | SqlToken;
export declare type NamedAssignment = {
    readonly [key: string]: ValueExpression;
};
export declare type SqlTaggedTemplate<Z extends QueryResultRow = QueryResultRow> = {
    <U extends QueryResultRow = Z>(template: TemplateStringsArray, ...values: ValueExpression[]): SqlSqlToken<U>;
    array: (values: readonly PrimitiveValueExpression[], memberType: SqlToken | TypeNameIdentifier) => ArraySqlToken;
    binary: (data: Buffer) => BinarySqlToken;
    date: (date: Date) => DateSqlToken;
    identifier: (names: readonly string[]) => IdentifierSqlToken;
    interval: (interval: IntervalInput) => IntervalSqlToken;
    join: (members: readonly ValueExpression[], glue: AnySqlSqlToken) => ListSqlToken;
    json: (value: SerializableValue) => JsonSqlToken;
    jsonb: (value: SerializableValue) => JsonBinarySqlToken;
    literalValue: (value: string) => SqlSqlToken;
    timestamp: (date: Date) => TimestampSqlToken;
    type: <Y extends ZodTypeAny>(parser: Y) => (template: TemplateStringsArray, ...values: ValueExpression[]) => SqlSqlToken<Y>;
    unnest: (tuples: ReadonlyArray<readonly any[]>, columnTypes: Array<[...string[], TypeNameIdentifier]> | Array<AnySqlSqlToken | TypeNameIdentifier>) => UnnestSqlToken;
};
export declare type InternalQueryMethod<R = any> = (log: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, slonikSql: TaggedTemplateLiteralInvocation, uid?: QueryId) => R;
export declare type InternalCopyFromBinaryFunction = (log: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, slonikSql: TaggedTemplateLiteralInvocation, tupleList: ReadonlyArray<readonly any[]>, columnTypes: readonly TypeNameIdentifier[]) => Promise<Record<string, unknown>>;
export declare type InternalStreamFunction = (log: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, slonikSql: TaggedTemplateLiteralInvocation, streamHandler: StreamHandler, uid?: QueryId, config?: QueryStreamConfig) => Promise<Record<string, unknown>>;
export declare type InternalTransactionFunction = <T>(log: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, handler: TransactionFunction<T>, transactionRetryLimit?: number) => Promise<T>;
export declare type InternalNestedTransactionFunction = <T>(log: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, handler: TransactionFunction<T>, transactionDepth: number, transactionRetryLimit?: number) => Promise<T>;
export declare type MixedRow = QueryResultRow | ZodTypeAny;
export declare type TaggedTemplateLiteralInvocation = AnySqlSqlToken;
export declare type QueryAnyFirstFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<ReadonlyArray<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T>[keyof z.infer<T>] : T[keyof T]) : T>>;
export declare type QueryAnyFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<ReadonlyArray<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T> : T) : T>>;
export declare type QueryExistsFunction = (sql: TaggedTemplateLiteralInvocation, values?: PrimitiveValueExpression[]) => Promise<boolean>;
export declare type QueryFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<QueryResult<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T> : T) : T>>;
export declare type QueryManyFirstFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<ReadonlyArray<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T>[keyof z.infer<T>] : T[keyof T]) : T>>;
export declare type QueryManyFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<ReadonlyArray<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T> : T) : T>>;
export declare type QueryMaybeOneFirstFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<(T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T>[keyof z.infer<T>] : T[keyof T]) : T) | null>;
export declare type QueryMaybeOneFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<(T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T> : T) : T) | null>;
export declare type QueryOneFirstFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T>[keyof z.infer<T>] : T[keyof T]) : T>;
export declare type QueryOneFunction = <T extends MixedRow | PrimitiveValueExpression>(sql: SqlSqlToken<T extends MixedRow ? T : Record<string, PrimitiveValueExpression>>, values?: PrimitiveValueExpression[]) => Promise<T extends MixedRow ? (T extends ZodTypeAny ? z.infer<T> : T) : T>;
export declare type Interceptor = {
    readonly afterPoolConnection?: (connectionContext: ConnectionContext, connection: DatabasePoolConnection) => MaybePromise<null>;
    readonly afterQueryExecution?: (queryContext: QueryContext, query: Query, result: QueryResult<QueryResultRow>) => MaybePromise<null>;
    readonly beforePoolConnection?: (connectionContext: PoolContext) => MaybePromise<DatabasePool | null | undefined>;
    readonly beforePoolConnectionRelease?: (connectionContext: ConnectionContext, connection: DatabasePoolConnection) => MaybePromise<null>;
    readonly beforeQueryExecution?: (queryContext: QueryContext, query: Query) => MaybePromise<QueryResult<QueryResultRow> | null>;
    readonly beforeQueryResult?: (queryContext: QueryContext, query: Query, result: QueryResult<QueryResultRow>) => MaybePromise<null>;
    readonly beforeTransformQuery?: (queryContext: QueryContext, query: Query) => MaybePromise<null>;
    readonly queryExecutionError?: (queryContext: QueryContext, query: Query, error: SlonikError, notices: readonly Notice[]) => MaybePromise<null>;
    readonly transformQuery?: (queryContext: QueryContext, query: Query) => Query;
    readonly transformRow?: (queryContext: QueryContext, query: Query, row: QueryResultRow, fields: readonly Field[]) => QueryResultRow;
};
export declare type IdentifierNormalizer = (identifierName: string) => string;
export declare type MockPoolOverrides = {
    readonly query: (sql: string, values: readonly PrimitiveValueExpression[]) => Promise<QueryResult<QueryResultRow>>;
};
export type { Logger, } from 'roarr';
export declare type TypeOverrides = {
    setTypeParser: (type: string, parser: (value: string) => unknown) => void;
};
export { NoticeMessage as Notice, } from 'pg-protocol/dist/messages';