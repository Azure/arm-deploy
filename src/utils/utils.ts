// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type DeploymentResult = {
  outputs: Record<string, unknown>;
};

export function getDeploymentResult(commandOutput: string): DeploymentResult {
  // parse the result and save the outputs
  const outputs: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(commandOutput) as {
      properties: {
        outputs: {
          [index: string]: {
            value: unknown;
          };
        };
      };
    };

    for (const key in parsed.properties.outputs) {
      outputs[key] = parsed.properties.outputs[key].value;
    }
  } catch (err) {
    console.error(commandOutput);
  }

  return {
    outputs,
  };
}

export function joinCliArguments(...args: (string | undefined)[]) {
  return args.filter(Boolean).join(" ");
}