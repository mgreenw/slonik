import { type DeferredPromise } from 'p-defer';
import { type Pool as PgPool, type PoolClient as PgClientPool } from 'pg';
import { type TypeOverrides } from './types';
declare type PoolState = {
    ended: boolean;
    mock: boolean;
    poolId: string;
    typeOverrides: Promise<TypeOverrides> | null;
};
declare type PoolClientState = {
    activeQuery?: DeferredPromise<unknown>;
    connectionId: string;
    mock: boolean;
    poolId: string;
    terminated: Error | null;
    transactionDepth: number | null;
    transactionId: string | null;
};
export declare const poolStateMap: WeakMap<PgPool, PoolState>;
export declare const poolClientStateMap: WeakMap<PgClientPool, PoolClientState>;
export declare const getPoolState: (pool: PgPool) => PoolState;
export declare const getPoolClientState: (poolClient: PgClientPool) => PoolClientState;
export {};