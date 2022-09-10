"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntervalSqlFragment = void 0;
const zod_1 = require("zod");
const errors_1 = require("../errors");
const IntervalInput = zod_1.z.object({
    days: zod_1.z.number().optional(),
    hours: zod_1.z.number().optional(),
    minutes: zod_1.z.number().optional(),
    months: zod_1.z.number().optional(),
    seconds: zod_1.z.number().optional(),
    weeks: zod_1.z.number().optional(),
    years: zod_1.z.number().optional(),
}).strict();
const intervalFragments = [
    'years',
    'months',
    'days',
    'hours',
    'minutes',
    'seconds',
];
const createIntervalSqlFragment = (token, greatestParameterPosition) => {
    let intervalInput;
    try {
        intervalInput = IntervalInput.parse(token.interval);
    }
    catch (_a) {
        throw new errors_1.InvalidInputError('Interval input must not contain unknown properties.');
    }
    const values = [];
    const intervalTokens = [];
    for (const intervalFragment of intervalFragments) {
        const value = intervalInput[intervalFragment];
        if (value !== undefined) {
            values.push(value);
            intervalTokens.push(intervalFragment + ' => $' + String(greatestParameterPosition + values.length));
        }
    }
    return {
        sql: 'make_interval(' + intervalTokens.join(', ') + ')',
        values,
    };
};
exports.createIntervalSqlFragment = createIntervalSqlFragment;
