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

  const streamsByType = new Map<string, IffmpegCommandStream[]>();

  originalStreams.forEach((stream) => {
    const { codec_type } = stream;

    if (!streamsByType.has(codec_type)) {
      streamsByType.set(codec_type, []);
    }

    streamsByType.get(codec_type)?.push(stream);
  });

  const outputStreams: IffmpegCommandStream[] = [];

  streamsByType.forEach((streams, type) => {
    let filteredStreams = languages
      .flatMap((lang) => streams.filter((s) => (s.tags?.language || 'und') === lang));

    if (filteredStreams.length === 0) {
      filteredStreams = streams;
      args.jobLog(`No matching streams were found for codec type ${type}, keeping the originals.`);
    }

    // Additional sorting for audio streams - deprioritize directors commentaries
    if (type === 'audio') {
      filteredStreams.sort((a, b) => {
        const aIsCommentary = a.tags?.title?.toLowerCase().includes('commentary') ?? false;
        const bIsCommentary = b.tags?.title?.toLowerCase().includes('commentary') ?? false;
        if (aIsCommentary === bIsCommentary) return 0;
        if (aIsCommentary) return 1;
        return -1;
      });
    }

    outputStreams.push(...filteredStreams);
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
  const dispositionArgs = outputStreams.flatMap((_, i) => [`-disposition:${i}`, '0']);

  // Set the first stream for each codec type as the default, clearing the rest
  const seenStreamTypes: Set<string> = new Set();

  outputStreams.forEach((stream, i) => {
    if (!seenStreamTypes.has(stream.codec_type)) {
      dispositionArgs.push(`-disposition:${i}`, 'default');
      seenStreamTypes.add(stream.codec_type);
    }
  });

  args.variables.ffmpegCommand.overallOuputArguments.push(
    ...dispositionArgs,
  );

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export { details, plugin };
