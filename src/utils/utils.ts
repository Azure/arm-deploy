// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { debug, setSecret } from "@actions/core";

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
            value: any;
          };
        };
      };
    };

    debug("registering secrets for keys: " + maskedOutputs);
    for (const key in parsed.properties.outputs) {
      const maskedValue = parsed.properties.outputs[key].value;
      if (maskedOutputs && maskedOutputs.some(maskedKey => maskedKey === key)) {
        setSecret(JSON.stringify(maskedValue));
        debug("registered output value as secret for key: " + key);
      }
      outputs[key] = maskedValue;
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
