import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Filter Stream by Language',
  description:
    'Filter streams by language, keeping at least one stream for each type. '
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
      tooltip: `Specify the language tags order, separated by commas.
        \\nExample:\\n
        eng,fre,und
        `,
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const originalStreams: IffmpegCommandStream[] = JSON.parse(
    JSON.stringify(args.variables.ffmpegCommand.streams),
  );

  const languages = (args.inputs.languages as string).split(',');

  // A nested map to let us process the entire file in a single pass.
  // The outer map is keyed by codec type (video, audio, etc.). The inner map is
  // a map from language code to overall stream index.
  // Later logic depends on the fact that map iteration is by insertion order,
  // which is how stream types get inserted back in the original order (as long
  // as they aren't interleaved).
  const streamTypeLanguageIndexes: Map<
    string,
    Map<string, number[]>
  > = new Map();

  originalStreams.forEach((stream, i) => {
    const streamType = stream.codec_type;

    if (!streamTypeLanguageIndexes.has(streamType)) {
      streamTypeLanguageIndexes.set(streamType, new Map());
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languageIndexes = streamTypeLanguageIndexes.get(streamType)!;

    const language = stream.tags?.language || 'und';
    if (!languageIndexes.has(language)) {
      languageIndexes.set(language, []);
    }

    languageIndexes.get(language)?.push(i);
  });

  // Map from stream type to streams
  const streamsToKeep: Map<string, IffmpegCommandStream[]> = new Map();

  streamTypeLanguageIndexes.forEach((langIndexes, streamType) => {
    // All the streams to keep for this stream type, in the preferred order
    const filteredStreams = languages
      .map((lang) => (langIndexes.get(lang) || []).map((i) => originalStreams[i]))
      .flat();

    if (filteredStreams.length === 0) {
      // If no matching streams were found, keep the originals
      streamsToKeep.set(
        streamType,
        originalStreams.filter((s) => s.codec_type === streamType),
      );
      args.jobLog(
        `No matching streams were found for codec type ${streamType}, keeping the originals.`,
      );
    } else {
      streamsToKeep.set(streamType, filteredStreams);
    }
  });

  const outputStreams = Array.from(streamsToKeep)
    .map(([, streams]) => streams)
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
  const seenStreamTypes: Set<string> = new Set();
  const dispositionRemovalArgs: string[] = [];
  const dispositionSetArgs: string[] = [];

  outputStreams.forEach((stream, i) => {
    if (seenStreamTypes.has(stream.codec_type)) {
      dispositionRemovalArgs.push(`-disposition:${i}`, '0');
    } else {
      dispositionSetArgs.push(`-disposition:${i}`, 'default');
      seenStreamTypes.add(stream.codec_type);
    }
  });

  args.variables.ffmpegCommand.overallOuputArguments.push(
    ...dispositionRemovalArgs,
    ...dispositionSetArgs,
  );

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export { details, plugin };
