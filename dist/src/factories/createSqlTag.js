"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSqlTag = void 0;
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const zod_1 = require("zod");
const Logger_1 = require("../Logger");
const errors_1 = require("../errors");
const tokens_1 = require("../tokens");
const utilities_1 = require("../utilities");
const createSqlTokenSqlFragment_1 = require("./createSqlTokenSqlFragment");
const log = Logger_1.Logger.child({
    namespace: 'sql',
});
const createQuery = (parts, values) => {
    let rawSql = '';
    const parameterValues = [];
    let index = 0;
    for (const part of parts) {
        const token = values[index++];
        rawSql += part;
        if (index >= parts.length) {
            continue;
        }
        if (token === undefined) {
            log.debug({
                index,
                parts: JSON.parse((0, fast_safe_stringify_1.default)(parts)),
                values: JSON.parse((0, fast_safe_stringify_1.default)(values)),
            }, 'bound values');
            throw new errors_1.InvalidInputError('SQL tag cannot be bound an undefined value.');
        }
        else if ((0, utilities_1.isPrimitiveValueExpression)(token)) {
            rawSql += '$' + String(parameterValues.length + 1);
            parameterValues.push(token);
        }
        else if ((0, utilities_1.isSqlToken)(token)) {
            const sqlFragment = (0, createSqlTokenSqlFragment_1.createSqlTokenSqlFragment)(token, parameterValues.length);
            rawSql += sqlFragment.sql;
            parameterValues.push(...sqlFragment.values);
        }
        else {
            log.error({
                constructedSql: rawSql,
                index,
                offendingToken: JSON.parse((0, fast_safe_stringify_1.default)(token)),
            }, 'unexpected value expression');
            throw new TypeError('Unexpected value expression.');
        }
    }
    return {
        sql: rawSql,
        values: parameterValues,
    };
};
const sql = (parts, ...args) => {
    const { sql: sqlText, values, } = createQuery(parts, args);
    const query = {
        sql: sqlText,
        type: tokens_1.SqlToken,
        values,
    };
    Object.defineProperty(query, 'sql', {
        configurable: false,
        enumerable: true,
        writable: false,
    });
    return query;
};
sql.array = (values, memberType) => {
    return {
        memberType,
        type: tokens_1.ArrayToken,
        values,
    };
};
sql.binary = (data) => {
    return {
        data,
        type: tokens_1.BinaryToken,
    };
};
sql.date = (date) => {
    return {
        date,
        type: tokens_1.DateToken,
    };
};
sql.identifier = (names) => {
    return {
        names,
        type: tokens_1.IdentifierToken,
    };
};
sql.interval = (interval) => {
    return {
        interval,
        type: tokens_1.IntervalToken,
    };
};
sql.join = (members, glue) => {
    return {
        glue,
        members,
        type: tokens_1.ListToken,
    };
};
sql.json = (value) => {
    return {
        type: tokens_1.JsonToken,
        value,
    };
};
sql.jsonb = (value) => {
    return {
        type: tokens_1.JsonBinaryToken,
        value,
    };
};
sql.literalValue = (value) => {
    return {
        parser: zod_1.z.any({}),
        sql: (0, utilities_1.escapeLiteralValue)(value),
        type: tokens_1.SqlToken,
        values: [],
    };
};
sql.timestamp = (date) => {
    return {
        date,
        type: tokens_1.TimestampToken,
    };
};
sql.type = (parser) => {
    return (parts, ...args) => {
        const { sql: sqlText, values, } = createQuery(parts, args);
        const query = {
            parser,
            sql: sqlText,
            type: tokens_1.SqlToken,
            values,
        };
        Object.defineProperty(query, 'sql', {
            configurable: false,
            enumerable: true,
            writable: false,
        });
        return query;
    };
};
sql.unnest = (tuples, columnTypes) => {
    return {
        columnTypes,
        tuples,
        type: tokens_1.UnnestToken,
    };
};
const createSqlTag = () => {
    return sql;
};
exports.createSqlTag = createSqlTag;
