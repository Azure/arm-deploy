// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as core from "@actions/core";
import { DeploymentResult, joinCliArguments } from "../utils/utils";
import { AzCliHelper } from "../utils/azhelper";

export async function deployManagementGroupScope(
  azCli: AzCliHelper,
  region: string,
  template: string | undefined,
  deploymentMode: string | undefined,
  deploymentName: string,
  parameters: string | undefined,
  managementGroupId: string,
  failOnStdErr: boolean,
  maskedOutputs: string[] | undefined,
  additionalArguments: string | undefined,
): Promise<DeploymentResult | undefined> {
  // Check if region is set
  if (!region) {
    throw Error("Region must be set.");
  }

  // check if mode is set as this will be ignored
  if (deploymentMode && deploymentMode != "validate") {
    core.warning(
      "This deployment mode is not supported for management group scoped deployments, this parameter will be ignored!",
    );
  }

  // create the parameter list
  const validateParameters = joinCliArguments(
    region ? `--location "${region}"` : undefined,
    template
      ? template.startsWith("http")
        ? `--template-uri ${template}`
        : `--template-file ${template}`
      : undefined,
    managementGroupId
      ? `--management-group-id "${managementGroupId}"`
      : undefined,
    deploymentName ? `--name "${deploymentName}"` : undefined,
    parameters ? `--parameters ${parameters}` : undefined,
  );

  let azDeployParameters = validateParameters;
  if (additionalArguments) {
    azDeployParameters += ` ${additionalArguments}`;
  }

  // validate the deployment
  core.info("Validating template...");
  await azCli.validate(
    `deployment mg validate ${validateParameters} -o json`,
    deploymentMode === "validate",
  );

  if (deploymentMode != "validate") {
    // execute the deployment
    core.info("Creating deployment...");
    return await azCli.deploy(
      `deployment mg create ${azDeployParameters} -o json`,
      maskedOutputs,
      failOnStdErr,
    );
  }
}
