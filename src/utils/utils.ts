// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {setSecret} from "@actions/core";

export type DeploymentResult = {
  outputs: Record<string, unknown>;
};

export function getDeploymentResult(commandOutput: string, maskedOutputs: string[]|undefined): DeploymentResult {
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
      if (maskedOutputs && maskedOutputs.includes(key)) {
        setSecret(parsed.properties.outputs[key].value.toString());
      }
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
