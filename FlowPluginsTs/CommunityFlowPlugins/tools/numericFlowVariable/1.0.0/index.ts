import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
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
      tooltip: `Variable name.
      
      \\nExample\\n
      outputCount
      
      \\n
      You can then use this by accessing
      {{{args.variables.user.outputCount}}}
      `,
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  if (!args.variables.user) {
    // eslint-disable-next-line no-param-reassign
    args.variables.user = {};
  }

  const operation = String(args.inputs.operation);
  const variable = String(args.inputs.variable);

  let oldValue: number | undefined;
  let newValue = 0;
  if (operation === 'set') {
    const value = String(args.inputs.value);

    if (Number.isNaN(parseInt(value, 10))) {
      throw new Error(`Value ${value} is not a number`);
    }
    // eslint-disable-next-line no-param-reassign
    newValue = parseInt(value, 10);
  } else if (operation === 'increment') {
    oldValue = parseInt(args.variables.user[variable] || '0', 10);
    newValue = oldValue + 1;
  } else if (operation === 'decrement') {
    oldValue = parseInt(args.variables.user[variable] || '0', 10);
    newValue = oldValue - 1;
  }

  // eslint-disable-next-line no-param-reassign
  args.variables.user[variable] = String(newValue);

  args.jobLog(`Setting variable ${variable} to from ${oldValue} to ${newValue}`);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
