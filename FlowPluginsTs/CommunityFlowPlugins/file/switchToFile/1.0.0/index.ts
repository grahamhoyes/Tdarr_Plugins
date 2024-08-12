import {
  fileExists, getContainer, getFileAbosluteDir, getFileName,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Switch to File',
  description:
    'Load a file as the current working file. Useful for switching to a pre-transcoded version mid-flow.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'File To Load',
      name: 'fileToLoad',
      type: 'string',
      // eslint-disable-next-line no-template-curly-in-string
      defaultValue: '${fileName}_720p.${container}',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line no-template-curly-in-string
      tooltip: 'Specify file to check using templating e.g. ${fileName}_720p.${container}',
    },
    {
      label: 'Directory',
      name: 'directory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'directory',
      },
      tooltip: 'Specify directory to check. Leave blank to use working directory.',
    },
    {
      label: 'Use original file working directory',
      name: 'useOriginalWorkingDirectory',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: "Load a file from the original file's directory. Overrides the Directory setting.",
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
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let directory: string;
  if (args.inputs.useOriginalWorkingDirectory) {
    directory = getFileAbosluteDir(args.originalLibraryFile._id);
  } else {
    directory = args.inputs.directory as string;
  }

  const fileName = getFileName(args.inputFileObj._id);

  let fileToLoad = String(args.inputs.fileToLoad).trim();
  fileToLoad = fileToLoad.replace(/\${fileName}/g, fileName);
  fileToLoad = fileToLoad.replace(/\${container}/g, getContainer(args.inputFileObj._id));
  fileToLoad = `${directory}/${fileToLoad}`;

  if (await fileExists(fileToLoad)) {
    args.jobLog(`Loading file: ${fileToLoad}`);
    return {
      outputFileObj: {
        _id: fileToLoad,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.jobLog(`File does not exist: ${fileToLoad}`);
  throw new Error('File does not exist');
};
export { details, plugin };
