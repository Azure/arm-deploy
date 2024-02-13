// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  getBooleanInput,
  info,
  getInput,
  setFailed,
  setOutput,
} from "@actions/core";
import { deployResourceGroupScope } from "./deploy/scope_resourcegroup";
import { deployTenantScope } from "./deploy/scope_tenant";
import { deployManagementGroupScope } from "./deploy/scope_managementgroup";
import { deploySubscriptionScope } from "./deploy/scope_subscription";
import { DeploymentResult } from "./utils/utils";
import { getAzCliHelper } from "./utils/azhelper";

export type Options = {
  scope: string;
  managementGroupId: string;
  subscriptionId: string;
  resourceGroupName: string;
  region: string;
  template?: string;
  deploymentMode?: string;
  deploymentName: string;
  parameters?: string;
  additionalArguments?: string;
  failOnStdErr: boolean;
};

async function populateOptions(): Promise<Options> {
  const scope = getInput("scope") || "resourcegroup";
  const subscriptionId = getInput("subscriptionId");
  const region = getInput("region");
  const resourceGroupName = getInput("resourceGroupName");
  const template = getInput("template");
  const deploymentMode = getInput("deploymentMode").toLowerCase();
  const deploymentName = getInput("deploymentName");
  const parameters = getInput("parameters");
  const managementGroupId = getInput("managementGroupId");
  const additionalArguments = getInput("additionalArguments");
  let failOnStdErr;
  try {
    failOnStdErr = getBooleanInput("failOnStdErr");
  } catch (err) {
    failOnStdErr = true;
  }

  return {
    scope,
    subscriptionId,
    region: region,
    resourceGroupName,
    template,
    deploymentMode,
    deploymentName,
    parameters,
    managementGroupId,
    additionalArguments,
    failOnStdErr,
  };
}

export async function deploy(
  options: Options,
): Promise<DeploymentResult | undefined> {
  // determine az path
  const azCli = await getAzCliHelper();

  // retrieve action variables
  const {
    scope,
    subscriptionId,
    region: region,
    resourceGroupName,
    template,
    deploymentMode,
    deploymentName,
    parameters,
    managementGroupId,
    additionalArguments,
    failOnStdErr,
  } = options;

  // change the subscription context
  if (
    scope !== "tenant" &&
    scope !== "managementgroup" &&
    subscriptionId !== ""
  ) {
    info("Changing subscription context...");
    await azCli.setSubscriptionContext(subscriptionId);
  }

  // Run the Deployment
  switch (scope) {
    case "resourcegroup":
      return await deployResourceGroupScope(
        azCli,
        resourceGroupName,
        template,
        deploymentMode,
        deploymentName,
        parameters,
        failOnStdErr,
        additionalArguments,
      );

    case "tenant":
      return await deployTenantScope(
        azCli,
        region,
        template,
        deploymentMode,
        deploymentName,
        parameters,
        failOnStdErr,
        additionalArguments,
      );

    case "managementgroup":
      return await deployManagementGroupScope(
        azCli,
        region,
        template,
        deploymentMode,
        deploymentName,
        parameters,
        managementGroupId,
        failOnStdErr,
        additionalArguments,
      );

    case "subscription":
      return await deploySubscriptionScope(
        azCli,
        region,
        template,
        deploymentMode,
        deploymentName,
        parameters,
        failOnStdErr,
        additionalArguments,
      );

    default:
      throw new Error(
        "Invalid scope. Valid values are: 'resourcegroup', 'tenant', 'managementgroup', 'subscription'",
      );
  }
}

// Action Main code
export async function main() {
  try {
    const options = await populateOptions();
    const result = await deploy(options);

    if (result) {
      for (const outputName in result.outputs) {
        setOutput(outputName, result.outputs[outputName]);
      }
    }
  } catch (err) {
    setFailed(`${err}`);
  }
}
