import { type PoolClient as PgPoolClient } from 'pg';
import { type ClientConfiguration, type Logger, type PrimitiveValueExpression, type Query, type QueryContext, type QueryId, type QueryResult, type QueryResultRow, type TaggedTemplateLiteralInvocation } from '../types';
declare type GenericQueryResult = QueryResult<QueryResultRow>;
declare type ExecutionRoutineType = (connection: PgPoolClient, sql: string, values: readonly PrimitiveValueExpression[], queryContext: QueryContext, query: Query) => Promise<GenericQueryResult>;
export declare const executeQuery: (connectionLogger: Logger, connection: PgPoolClient, clientConfiguration: ClientConfiguration, slonikSqlRename: TaggedTemplateLiteralInvocation, inheritedQueryId: QueryId | undefined, executionRoutine: ExecutionRoutineType) => Promise<QueryResult<Record<string, PrimitiveValueExpression>>>;
export {};