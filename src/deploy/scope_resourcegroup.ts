// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as core from "@actions/core";
import { DeploymentResult, joinCliArguments } from "../utils/utils";
import { AzCliHelper } from "../utils/azhelper";

export async function deployResourceGroupScope(
  azCli: AzCliHelper,
  resourceGroupName: string,
  template: string | undefined,
  deploymentMode: string | undefined,
  deploymentName: string,
  parameters: string | undefined,
  failOnStdErr: boolean,
  additionalArguments: string | undefined,
): Promise<DeploymentResult | undefined> {
  // Check if resourceGroupName is set
  if (!resourceGroupName) {
    throw Error("ResourceGroup name must be set.");
  }

  // Check if the resourceGroup exists
  const rgExists = await azCli.resourceGroupExists(resourceGroupName);
  if (!rgExists) {
    throw Error(`Resource Group ${resourceGroupName} could not be found.`);
  }

  // create the parameter list
  const validateParameters = joinCliArguments(
    resourceGroupName ? `--resource-group ${resourceGroupName}` : undefined,
    template
      ? template.startsWith("http")
        ? `--template-uri ${template}`
        : `--template-file ${template}`
      : undefined,
    deploymentMode && deploymentMode != "validate"
      ? `--mode ${deploymentMode}`
      : "--mode Incremental",
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
    `deployment group validate ${validateParameters} -o json`,
    deploymentMode === "validate",
  );

  if (deploymentMode != "validate") {
    // execute the deployment
    core.info("Creating deployment...");
    return await azCli.deploy(
      `deployment group create ${azDeployParameters} -o json`,
      failOnStdErr,
    );
  }
}
