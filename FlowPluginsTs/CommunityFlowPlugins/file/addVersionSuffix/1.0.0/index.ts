import fileMoveOrCopy from '../../../../FlowHelpers/1.0.0/fileMoveOrCopy';
import {
  getContainer,
  getFileAbosluteDir,
  getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Add Version Suffix',
  description:
    'Add a version suffix to the filename.\n'
    + 'Versions come at the end of the filename, after a ` -` delimiter. This plugin tracks whether the delimiter '
    + 'has already been added, so it is only added once per flow.\n'
    + 'To add the delimiter again, use the `setFlowVariable` plugin to set `addedVersionDelimiter` to "false".',
  style: {
    borderColor: 'green',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Version suffix',
      name: 'suffix',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: ' 1080p',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify the suffix to add. You should start it with a space.',
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
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  // Note: This intentionally doesn't use lib.loadDefaultValues to avoid trimming

  // Original input without getting trimmed / type converted
  const suffix = String(args.inputs.suffix) || '';

  const fileName = getFileName(args.inputFileObj._id);
  const container = getContainer(args.inputFileObj._id);
  const fileDir = getFileAbosluteDir(args.inputFileObj._id);

  if (!args.variables.user) {
    // eslint-disable-next-line no-param-reassign
    args.variables.user = {};
  }

  // Yes, this has to be a string
  const addDelimiter = args.variables.user.addedVersionDelimiter !== 'true';

  let newName = fileName;
  if (addDelimiter) {
    newName += ' -';

    if (!suffix.startsWith(' ')) newName += ' ';
  }
  newName += `${suffix}.${container}`;

  const newPath = `${fileDir}/${newName}`;

  if (args.inputFileObj._id === newPath) {
    args.jobLog('Input and output path are the same, skipping rename.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Make sure we don't add the delimiter on future calls
  // eslint-disable-next-line no-param-reassign
  args.variables.user.addedVersionDelimiter = 'true';

  await fileMoveOrCopy({
    operation: 'move',
    sourcePath: args.inputFileObj._id,
    destinationPath: newPath,
    args,
  });

  return {
    outputFileObj: {
      _id: newPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};
export { details, plugin };
