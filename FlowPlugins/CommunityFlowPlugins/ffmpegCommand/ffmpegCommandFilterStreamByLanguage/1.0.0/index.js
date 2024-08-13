"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Filter Stream by Language',
    description: 'Filter streams by language, keeping at least one stream for each type. '
        + 'Recommended to follow this with a reorder streams plugin.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video,audio',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Languages',
            name: 'languages',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: "Specify the language tags order, separated by commas.\n        \\nExample:\\n\n        eng,fre,und\n        ",
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
    var _a;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var originalStreams = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));
    var languages = args.inputs.languages.split(',');
    var streamsByType = new Map();
    originalStreams.forEach(function (stream) {
        var _a;
        var codec_type = stream.codec_type;
        if (!streamsByType.has(codec_type)) {
            streamsByType.set(codec_type, []);
        }
        (_a = streamsByType.get(codec_type)) === null || _a === void 0 ? void 0 : _a.push(stream);
    });
    var outputStreams = [];
    streamsByType.forEach(function (streams, type) {
        var filteredStreams = languages
            .flatMap(function (lang) { return streams.filter(function (s) { var _a; return (((_a = s.tags) === null || _a === void 0 ? void 0 : _a.language) || 'und') === lang; }); });
        if (filteredStreams.length === 0) {
            filteredStreams = streams;
            args.jobLog("No matching streams were found for codec type ".concat(type, ", keeping the originals."));
        }
        // Additional sorting for audio streams - deprioritize directors commentaries
        if (type === 'audio') {
            filteredStreams.sort(function (a, b) {
                var _a, _b, _c, _d, _e, _f;
                var aIsCommentary = (_c = (_b = (_a = a.tags) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes('commentary')) !== null && _c !== void 0 ? _c : false;
                var bIsCommentary = (_f = (_e = (_d = b.tags) === null || _d === void 0 ? void 0 : _d.title) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes('commentary')) !== null && _f !== void 0 ? _f : false;
                if (aIsCommentary === bIsCommentary)
                    return 0;
                if (aIsCommentary)
                    return 1;
                return -1;
            });
        }
        outputStreams.push.apply(outputStreams, filteredStreams);
    });
    if (JSON.stringify(outputStreams) === JSON.stringify(originalStreams)) {
        args.jobLog('No changes required');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.streams = outputStreams;
    // Start by clearing the disposition for all streams
    var dispositionArgs = outputStreams.flatMap(function (_, i) { return ["-disposition:".concat(i), '0']; });
    // Set the first stream for each codec type as the default, clearing the rest
    var seenStreamTypes = new Set();
    outputStreams.forEach(function (stream, i) {
        if (!seenStreamTypes.has(stream.codec_type)) {
            dispositionArgs.push("-disposition:".concat(i), 'default');
            seenStreamTypes.add(stream.codec_type);
        }
    });
    (_a = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_a, dispositionArgs);
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
