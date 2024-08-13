"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Set Flow Variable',
    description: "Set a Flow Variable to whatever you like. This can be used with the 'Check Flow Variable'\n  plugin for complex flows with loops in them where you're wanting to keep track \n  of where you are in the flow. For example, when attempting to transcode with NVENC, then QSV, then CPU.",
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
            tooltip: "Variable to set.\n      \n      \\nExample\\n\n      transcodeStage\n      \n      \\n\n      You can then check this in the 'Check Flow Variable' plugin\n      {{{args.variables.user.transcodeStage}}}\n      ",
        },
        {
            label: 'Value',
            name: 'value',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: "Value to set.\n      \n      \\nExample\\n\n      1\n      \n      \\nExample\\n\n      nvenc\n      ",
        },
        {
            label: 'Preprocess',
            name: 'preprocess',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Preprocess the value, including removing whitespace',
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
    // Clone since loadDefaultValues will modify by reference
    var clonedInputs = JSON.parse(JSON.stringify(args.inputs));
    var processedInputs = lib.loadDefaultValues(clonedInputs, details);
    if (processedInputs.preprocess) {
        args.jobLog('Using processed inputs');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
        args.inputs = processedInputs;
    }
    else {
        var value_1 = args.inputs.value;
        args.jobLog("Using raw value: \"".concat(value_1, "\""));
        // eslint-disable-next-line no-param-reassign
        args.inputs = processedInputs;
        // eslint-disable-next-line no-param-reassign
        args.inputs.value = value_1;
    }
    var variable = String(args.inputs.variable).trim();
    var value = String(args.inputs.value);
    if (!args.variables.user) {
        // eslint-disable-next-line no-param-reassign
        args.variables.user = {};
    }
    args.jobLog("Setting variable ".concat(variable, " to \"").concat(value, "\""));
    // eslint-disable-next-line no-param-reassign
    args.variables.user[variable] = value;
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
