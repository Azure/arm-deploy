import { info } from '@actions/core';
import { which } from '@actions/io';
import { DeployResourceGroupScope } from './deploy/scope_resourcegroup';
import { exec } from '@actions/exec';
import { DeployManagementGroupScope } from './deploy/scope_managementgroup';
import { DeploySubscriptionScope } from './deploy/scope_subscription';
import { Outputs } from './utils/utils';
import { getInput } from '@actions/core';

// Action Main code
export async function main(): Promise<Outputs> {
    // determine az path
    const azPath = await which("az", true);

    // retrieve action variables
    const scope = getInput('scope')||"resourcegroup"
    const subscriptionId = getInput('subscriptionId')
    const region = getInput('region')
    const resourceGroupName = getInput('resourceGroupName')
    const template = getInput('template')
    const deploymentMode = getInput('deploymentMode')
    const deploymentName = getInput('deploymentName')
    const parameters = getInput('parameters')
    const managementGroupId = getInput('managementGroupId')

    // change the subscription context
    if (scope != "managementgroup") {
        info("Changing subscription context...")
        await exec(`"${azPath}" account set --subscription ${subscriptionId}`, [], { silent: true })
    }

    // Run the Deployment
    let result: Outputs = {};
    switch(scope) {
        case "resourcegroup":
            result = await DeployResourceGroupScope(azPath, resourceGroupName, template, deploymentMode, deploymentName, parameters)
            break
        case "managementgroup":
            result = await DeployManagementGroupScope(azPath, region, template, deploymentMode, deploymentName, parameters, managementGroupId)
            break
        case "subscription":
            result = await DeploySubscriptionScope(azPath, region, template, deploymentMode, deploymentName, parameters)
            break
        default:
            throw new Error("Invalid scope. Valid values are: 'resourcegroup', 'managementgroup', 'subscription'")
    }

    return result
}