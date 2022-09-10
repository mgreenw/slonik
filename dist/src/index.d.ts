export declare const sql: import("./types").SqlTaggedTemplate<import("./types").QueryResultRow>;
export type { ArraySqlToken, BinarySqlToken, ClientConfiguration, ClientConfigurationInput, CommonQueryMethods, Connection, ConnectionOptions, DatabaseConnection, DatabasePool, DatabasePoolConnection, DatabaseTransactionConnection, Field, IdentifierNormalizer, IdentifierSqlToken, Interceptor, JsonBinarySqlToken, JsonSqlToken, ListSqlToken, MixedRow, MockPoolOverrides, PoolContext, PrimitiveValueExpression, Query, QueryContext, QueryResult, QueryResultRow, QueryResultRowColumn, SerializableValue, SqlSqlToken, SqlTaggedTemplate, SqlToken, TaggedTemplateLiteralInvocation, TypeNameIdentifier, TypeParser, UnnestSqlToken, ValueExpression, } from './types';
export { createMockPool, createMockQueryResult, createPool, createSqlTag, createSqlTokenSqlFragment, createTypeParserPreset, } from './factories';
export { isSqlToken, parseDsn, stringifyDsn, } from './utilities';
export * from './factories/typeParsers';
export { BackendTerminatedError, CheckIntegrityConstraintViolationError, ConnectionError, DataIntegrityError, ForeignKeyIntegrityConstraintViolationError, IntegrityConstraintViolationError, InvalidConfigurationError, InvalidInputError, NotFoundError, NotNullIntegrityConstraintViolationError, SchemaValidationError, SlonikError, StatementCancelledError, StatementTimeoutError, TupleMovedToAnotherPartitionError, UnexpectedStateError, UniqueIntegrityConstraintViolationError, } from './errors';