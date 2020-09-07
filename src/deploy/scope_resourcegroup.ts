import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';

export async function DeployResourceGroupScope(azPath: string, validationOnly: boolean, resourceGroupName: string, template: string, deploymentMode: string, deploymentName: string, parameters: string): Promise<Outputs> {
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
        deploymentMode ? `--mode ${deploymentMode}` : undefined,
        deploymentName ? `--name ${deploymentName}` : undefined,
        parameters ? `--parameters ${parameters}` : undefined
    ].filter(Boolean).join(' ');

    // configure exec to write the json output to a buffer
    let commandOutput = '';
    const deployOptions: ExecOptions = {
        silent: true,
        failOnStdErr: true,
        listeners: {
            stderr: (data: BufferSource) => {
                core.warning(data.toString());
            },
            stdline: (data: string) => {
                if (!data.startsWith("[command]"))
                    commandOutput += data;
                // console.log(data);
            },
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
    core.core.info("Validating template...")
    var code = await exec(`"${azPath}" deployment group validate ${azDeployParameters} -o json`, [], validateOptions);
    if (validationOnly && code != 0) {
        throw new Error("Template validation failed")
    } else if (code != 0) {
        core.warning("Template validation failed.")
    }

    // execute the deployment
    core.core.info("Creating deployment...")
    await exec(`"${azPath}" deployment group create ${azDeployParameters} -o json`, [], deployOptions);
    core.debug(commandOutput);
    
    // Parse the Outputs
    core.core.info("Parsing outputs...")
    return ParseOutputs(commandOutput)
}
