import { getBooleanInput, info, getInput } from '@actions/core';
import { which } from '@actions/io';
import { DeployResourceGroupScope } from './deploy/scope_resourcegroup';
import { exec } from '@actions/exec';
import { DeployManagementGroupScope } from './deploy/scope_managementgroup';
import { DeploySubscriptionScope } from './deploy/scope_subscription';
import { Outputs } from './utils/utils';

// Action Main code
export async function main(): Promise<Outputs> {
    // determine az path
    const azPath = await which("az", true);

    // retrieve action variables
    const scope = getInput('scope') || "resourcegroup"
    const subscriptionId = getInput('subscriptionId')
    const region = getInput('region')
    const resourceGroupName = getInput('resourceGroupName')
    const template = getInput('template')
    const deploymentMode = getInput('deploymentMode').toLowerCase()
    const deploymentName = getInput('deploymentName')
    const parameters = getInput('parameters')
    const managementGroupId = getInput('managementGroupId')
    const whatIfExcludeChangeTypes = getInput('whatIfExcludeChangeTypes')
    const whatIfResultFormat = getInput('whatIfResultFormat')

    let failOnStdErr
    try {
        failOnStdErr = getBooleanInput('failOnStdErr')
    }
    catch (err) {
        failOnStdErr = true
    }

    let whatIf
    try {
        whatIf = getBooleanInput('whatIf')
    }
    catch (err) {
        whatIf = false
    }

    let rollbackOnError
    try {
        rollbackOnError = getBooleanInput('rollbackOnError')
    }
    catch (err) {
        rollbackOnError = getInput('rollbackOnError')
    }

    if(scope != 'resourcegroup' && rollbackOnError != false){
        throw Error("rollbackOnError is only applicable for resourcegroup scope.")
    }

    // change the subscription context
    if (scope !== "managementgroup" && subscriptionId !== "") {
        info("Changing subscription context...")
        await exec(`"${azPath}" account set --subscription ${subscriptionId}`, [], { silent: true })
    }

    // Run the Deployment
    let result: Outputs = {};
    switch (scope) {
        case "resourcegroup":
            result = await DeployResourceGroupScope(azPath, resourceGroupName, template, deploymentMode, deploymentName, parameters, failOnStdErr, whatIf, whatIfExcludeChangeTypes, whatIfResultFormat, rollbackOnError)
            break
        case "managementgroup":
            result = await DeployManagementGroupScope(azPath, region, template, deploymentMode, deploymentName, parameters, managementGroupId, failOnStdErr, whatIf, whatIfExcludeChangeTypes, whatIfResultFormat)
            break
        case "subscription":
            result = await DeploySubscriptionScope(azPath, region, template, deploymentMode, deploymentName, parameters, failOnStdErr, whatIf, whatIfExcludeChangeTypes, whatIfResultFormat)
            break
        default:
            throw new Error("Invalid scope. Valid values are: 'resourcegroup', 'managementgroup', 'subscription'")
    }

    return result
}