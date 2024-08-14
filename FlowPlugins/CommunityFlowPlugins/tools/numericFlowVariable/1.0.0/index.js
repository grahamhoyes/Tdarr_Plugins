"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Numeric Flow Variable',
    description: 'Operate on a numeric flow variable. Access with {{{args.variables.user.name}}}.',
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: 1,
    icon: '',
    inputs: [
        {
            label: 'Variable',
            name: 'variable',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Variable name.\n      \n      \\nExample\\n\n      outputCount\n      \n      \\n\n      You can then use this by accessing\n      {{{args.variables.user.outputCount}}}\n      ",
        },
        {
            label: 'Operation',
            name: 'operation',
            type: 'string',
            defaultValue: 'set',
            inputUI: {
                type: 'dropdown',
                options: [
                    'set',
                    'increment',
                    'decrement',
                ],
            },
            tooltip: 'Operation to perform',
        },
        {
            label: 'Value',
            name: 'value',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'text',
                displayConditions: {
                    logic: 'AND',
                    sets: [{
                            logic: 'AND',
                            inputs: [{
                                    name: 'operation',
                                    value: 'set',
                                    condition: '===',
                                }],
                        }],
                },
            },
            tooltip: 'Value to set',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    if (!args.variables.user) {
        // eslint-disable-next-line no-param-reassign
        args.variables.user = {};
    }
    var operation = String(args.inputs.operation);
    var variable = String(args.inputs.variable);
    var oldValue;
    var newValue = 0;
    if (operation === 'set') {
        var value = String(args.inputs.value);
        if (Number.isNaN(parseInt(value, 10))) {
            throw new Error("Value ".concat(value, " is not a number"));
        }
        // eslint-disable-next-line no-param-reassign
        newValue = parseInt(value, 10);
    }
    else if (operation === 'increment') {
        oldValue = parseInt(args.variables.user[variable] || '0', 10);
        newValue = oldValue + 1;
    }
    else if (operation === 'decrement') {
        oldValue = parseInt(args.variables.user[variable] || '0', 10);
        newValue = oldValue - 1;
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.user[variable] = String(newValue);
    args.jobLog("Setting variable ".concat(variable, " to from ").concat(oldValue, " to ").concat(newValue));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
