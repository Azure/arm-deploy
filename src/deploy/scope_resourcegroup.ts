import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';

export async function DeployResourceGroupScope(azPath: string, resourceGroupName: string, template: string, deploymentMode: string, deploymentName: string, parameters: string, failOnStdErr: Boolean, whatIf: Boolean, whatIfExcludeChangeTypes: string, whatIfResultFormat: string, rollbackOnError: Boolean | string): Promise<Outputs> {
    // Check if resourceGroupName is set
    if (!resourceGroupName) {
        throw Error("ResourceGroup name must be set.")
    }

    // Check if the resourceGroup exists
    var result = await exec(`"${azPath}" group show --resource-group ${resourceGroupName}`, [], { silent: true, ignoreReturnCode: true });
    if (result != 0) {
        throw Error(`Resource Group ${resourceGroupName} could not be found.`)
    }

    // create the parameter list
    const azDeployParameters = [
        resourceGroupName ? `--resource-group ${resourceGroupName}` : undefined,
        template ?
            template.startsWith("http") ? `--template-uri ${template}` : `--template-file ${template}`
            : undefined,
        deploymentMode && deploymentMode != "validate" ? `--mode ${deploymentMode}` : "--mode Incremental",
        deploymentName ? `--name "${deploymentName}"` : undefined,
        parameters ? `--parameters ${parameters}` : undefined,
        whatIf ? '--what-if' : undefined,
        whatIfExcludeChangeTypes ? `--what-if-exclude-change-types ${whatIfExcludeChangeTypes}` : undefined,
        whatIfResultFormat ? `--what-if-result-format ${whatIfResultFormat}` : undefined,
        rollbackOnError === true ? '--rollback-on-error' : rollbackOnError === false ? undefined : `--rollback-on-error ${rollbackOnError}`
    ].filter(Boolean).join(' ');

    // configure exec to write the json output to a buffer
    let commandOutput = '';
    let commandStdErr = false;
    const deployOptions: ExecOptions = {
        silent: true,
        ignoreReturnCode: true,
        failOnStdErr: false,
        listeners: {
            stderr: (data: BufferSource) => {
                let error = data.toString();
                if (error && error.trim().length !== 0) {
                    commandStdErr = true;
                    core.error(error);
                }
            },
            stdout: (data: BufferSource) => {
                commandOutput += data.toString();
            },
            debug: (data: string) => {
                core.debug(data);
            }
        }
    }
    const validateOptions: ExecOptions = {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
            stderr: (data: BufferSource) => {
                core.warning(data.toString());
            },
        }
    }

    // validate the deployment
    if(!whatIf){
        core.info("Validating template...")
        var code = await exec(`"${azPath}" deployment group validate ${azDeployParameters} -o json`, [], validateOptions);
        if (deploymentMode.toLowerCase() === "validate" && code != 0) {
            throw new Error("Template validation failed.")
        } else if (code != 0) {
            core.warning("Template validation failed.")
        }
    }

    if (deploymentMode.toLowerCase() != "validate") {
        // execute the deployment
        core.info("Creating deployment...")
        var deploymentCode = await exec(`"${azPath}" deployment group create ${azDeployParameters} -o json`, [], deployOptions);

        if (deploymentCode != 0) {
            throw new Error("Deployment failed.")
        }
        if (commandStdErr && failOnStdErr) {
            throw new Error("Deployment process failed as some lines were written to stderr");
        }

        if (whatIf) {
            core.info("Previewing deployment changes using what-if.")
            core.info(commandOutput);
        } else {
            core.debug(commandOutput);
            core.info("Parsing outputs...")
            return ParseOutputs(commandOutput)
        }
    }
    return {}
}
