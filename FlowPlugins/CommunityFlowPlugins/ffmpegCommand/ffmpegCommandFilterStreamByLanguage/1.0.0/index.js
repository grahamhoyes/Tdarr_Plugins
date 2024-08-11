"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
    // A nested map to let us process the entire file in a single pass.
    // The outer map is keyed by codec type (video, audio, etc.). The inner map is
    // a map from language code to overall stream index.
    // Later logic depends on the fact that map iteration is by insertion order,
    // which is how stream types get inserted back in the original order (as long
    // as they aren't interleaved).
    var streamTypeLanguageIndexes = new Map();
    originalStreams.forEach(function (stream, i) {
        var _a, _b;
        var streamType = stream.codec_type;
        if (!streamTypeLanguageIndexes.has(streamType)) {
            streamTypeLanguageIndexes.set(streamType, new Map());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        var languageIndexes = streamTypeLanguageIndexes.get(streamType);
        var language = ((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) || 'und';
        if (!languageIndexes.has(language)) {
            languageIndexes.set(language, []);
        }
        (_b = languageIndexes.get(language)) === null || _b === void 0 ? void 0 : _b.push(i);
    });
    // Map from stream type to streams
    var streamsToKeep = new Map();
    streamTypeLanguageIndexes.forEach(function (langIndexes, streamType) {
        // All the streams to keep for this stream type, in the preferred order
        var filteredStreams = languages
            .map(function (lang) { return (langIndexes.get(lang) || []).map(function (i) { return originalStreams[i]; }); })
            .flat();
        if (filteredStreams.length === 0) {
            // If no matching streams were found, keep the originals
            streamsToKeep.set(streamType, originalStreams.filter(function (s) { return s.codec_type === streamType; }));
            args.jobLog("No matching streams were found for codec type ".concat(streamType, ", keeping the originals."));
        }
        else {
            streamsToKeep.set(streamType, filteredStreams);
        }
    });
    var outputStreams = Array.from(streamsToKeep)
        .map(function (_a) {
        var streams = _a[1];
        return streams;
    })
        .flat();
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
    // Set the first stream for each codec type as the default, clearing the rest
    var seenStreamTypes = new Set();
    var dispositionRemovalArgs = [];
    var dispositionSetArgs = [];
    outputStreams.forEach(function (stream, i) {
        if (seenStreamTypes.has(stream.codec_type)) {
            dispositionRemovalArgs.push("-disposition:".concat(i), '0');
        }
        else {
            dispositionSetArgs.push("-disposition:".concat(i), 'default');
            seenStreamTypes.add(stream.codec_type);
        }
    });
    (_a = args.variables.ffmpegCommand.overallOuputArguments).push.apply(_a, __spreadArray(__spreadArray([], dispositionRemovalArgs, false), dispositionSetArgs, false));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
