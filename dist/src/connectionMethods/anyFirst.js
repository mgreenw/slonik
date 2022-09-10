"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anyFirst = void 0;
const errors_1 = require("../errors");
const utilities_1 = require("../utilities");
const any_1 = require("./any");
const anyFirst = async (log, connection, clientConfigurationType, slonikSql, inheritedQueryId) => {
    const queryId = inheritedQueryId !== null && inheritedQueryId !== void 0 ? inheritedQueryId : (0, utilities_1.createQueryId)();
    const rows = await (0, any_1.any)(log, connection, clientConfigurationType, slonikSql, queryId);
    if (rows.length === 0) {
        return [];
    }
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    if (keys.length !== 1) {
        log.error({
            queryId,
        }, 'result row has no columns');
        throw new errors_1.DataIntegrityError();
    }
    const firstColumnName = keys[0];
    return rows.map((row) => {
        return row[firstColumnName];
    });
};
exports.anyFirst = anyFirst;
