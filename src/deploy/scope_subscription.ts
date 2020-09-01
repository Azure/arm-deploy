import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';
import { info, warning } from '@actions/core';

export async function DeploySubscriptionScope(azPath: string, validationOnly: boolean, location: string,  templateLocation: string, deploymentMode: string, deploymentName: string, parameters: string): Promise<Outputs> {    
    // Check if location is set
    if (!location) {
        throw Error("Location must be set.")
    }
    
    // check if mode is set as this will be ignored
    if (deploymentMode != "") {
        warning("Deployment Mode is not supported for subscription scoped deployments, this parameter will be ignored!")
    }

    // create the parameter list
    const azDeployParameters = [
        location ? `--location ${location}` : undefined,
        templateLocation ?
            templateLocation.startsWith("http") ? `--template-uri ${templateLocation}`: `--template-file ${templateLocation}`
        : undefined,
        deploymentName ? `--name ${deploymentName}` : undefined,
        parameters ? `--parameters ${parameters}` : undefined
    ].filter(Boolean).join(' ');

    // configure exec to write the json output to a buffer
    let commandOutput = '';
    const options: ExecOptions = {
        silent: true,
        failOnStdErr: true,
        listeners: {
            stdline: (data: string) => {
                if (!data.startsWith("[command]"))
                    commandOutput += data;
                // console.log(data);
            },   
        }
    }

    // validate the deployment
    info("Validating template...")
    var code = await exec(`"${azPath}" deployment sub validate ${azDeployParameters} -o json`, [], { silent: true, ignoreReturnCode: true });
    if (validationOnly && code != 0) {
        throw new Error("Template validation failed")
    } else if (code != 0) {
        warning("Template validation failed.")
    }

    // execute the deployment
    info("Creating deployment...")
    await exec(`"${azPath}" deployment sub create ${azDeployParameters} -o json`, [], options);

    // Parse the Outputs
    info("Parsing outputs...")
    return ParseOutputs(commandOutput)
}