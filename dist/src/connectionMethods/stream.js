"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = void 0;
const through2_1 = __importDefault(require("through2"));
const QueryStream_1 = require("../QueryStream");
const routines_1 = require("../routines");
const stream = async (connectionLogger, connection, clientConfiguration, slonikSql, streamHandler, uid, options) => {
    return await (0, routines_1.executeQuery)(connectionLogger, connection, clientConfiguration, slonikSql, undefined, async (finalConnection, finalSql, finalValues, executionContext, actualQuery) => {
        const query = new QueryStream_1.QueryStream(finalSql, finalValues, options);
        const queryStream = finalConnection.query(query);
        const rowTransformers = [];
        for (const interceptor of clientConfiguration.interceptors) {
            if (interceptor.transformRow) {
                rowTransformers.push(interceptor.transformRow);
            }
        }
        return await new Promise((resolve, reject) => {
            queryStream.on('error', (error) => {
                reject(error);
            });
            const transformedStream = queryStream.pipe(through2_1.default.obj(function (datum, enc, callback) {
                let finalRow = datum.row;
                if (rowTransformers.length) {
                    for (const rowTransformer of rowTransformers) {
                        finalRow = rowTransformer(executionContext, actualQuery, finalRow, datum.fields);
                    }
                }
                // eslint-disable-next-line @babel/no-invalid-this
                this.push({
                    fields: datum.fields,
                    row: finalRow,
                });
                callback();
            }));
            transformedStream.on('end', () => {
                resolve({
                    command: 'SELECT',
                    fields: [],
                    notices: [],
                    rowCount: 0,
                    rows: [],
                });
            });
            // Invoked if stream is destroyed using transformedStream.destroy().
            transformedStream.on('close', () => {
                resolve({
                    command: 'SELECT',
                    fields: [],
                    notices: [],
                    rowCount: 0,
                    rows: [],
                });
            });
            streamHandler(transformedStream);
        });
    });
};
exports.stream = stream;