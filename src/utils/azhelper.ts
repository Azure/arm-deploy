// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { ExecOptions, exec } from "@actions/exec";
import * as core from "@actions/core";
import { getDeploymentResult } from "./utils";
import { which } from "@actions/io";

export class AzCliHelper {
  constructor(private azPath: string) {}

  setSubscriptionContext = setSubscriptionContext.bind(null, this.azPath);
  resourceGroupExists = resourceGroupExists.bind(null, this.azPath);
  deploy = deploy.bind(null, this.azPath);
  validate = validate.bind(null, this.azPath);
}

export async function getAzCliHelper() {
  const azPath = await which("az", true);

  return new AzCliHelper(azPath);
}

async function setSubscriptionContext(azPath: string, subscriptionId: string) {
  await callAzCli(azPath, `account set --subscription ${subscriptionId}`, {
    silent: true,
  });
}

async function resourceGroupExists(azPath: string, resourceGroupName: string) {
  const exitCode = await callAzCli(
    azPath,
    `group show --resource-group ${resourceGroupName}`,
    { silent: true, ignoreReturnCode: true },
  );

  return exitCode === 0;
}

async function deploy(azPath: string, command: string, failOnStdErr: boolean) {
  let hasStdErr = false;
  let stdOut = "";
  const options: ExecOptions = {
    silent: true,
    ignoreReturnCode: true,
    failOnStdErr: false,
    listeners: {
      stderr: (data: BufferSource) => {
        const error = data.toString();
        if (error && error.trim().length !== 0) {
          hasStdErr = true;
          core.error(error);
        }
      },
      stdout: (data: BufferSource) => {
        stdOut += data.toString();
      },
      debug: (data: string) => {
        core.debug(data);
      },
    },
  };

  const exitCode = await callAzCli(azPath, command, options);

  if (exitCode != 0) {
    throw new Error("Deployment failed.");
  }

  if (hasStdErr && failOnStdErr) {
    throw new Error(
      "Deployment process failed as some lines were written to stderr",
    );
  }

  core.debug(stdOut);
  core.info("Parsing outputs...");
  return getDeploymentResult(stdOut);
}

async function validate(
  azPath: string,
  command: string,
  failOnNonZeroExit: boolean,
) {
  const options: ExecOptions = {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stderr: (data: BufferSource) => {
        core.warning(data.toString());
      },
    },
  };

  const exitCode = await callAzCli(azPath, command, options);

  if (failOnNonZeroExit && exitCode != 0) {
    throw new Error("Template validation failed.");
  } else if (exitCode != 0) {
    core.warning("Template validation failed.");
  }
}

async function callAzCli(
  azPath: string,
  command: string,
  options: ExecOptions,
) {
  return await exec(`"${azPath}" ${command}`, [], options);
}
