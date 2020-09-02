import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';
import { info, warning } from '@actions/core';

export async function DeploySubscriptionScope(azPath: string, validationOnly: boolean, region: string, templates: string, deploymentMode: string, deploymentName: string, parameters: string): Promise<Outputs> {
    // Check if region is set
    if (!region) {
        throw Error("Region must be set.")
    }

    // check if mode is set as this will be ignored
    if (deploymentMode != "") {
        warning("Deployment Mode is not supported for subscription scoped deployments, this parameter will be ignored!")
    }

    // create the parameter list
    const azDeployParameters = [
        region ? `--location ${region}` : undefined,
        templates ?
            templates.startsWith("http") ? `--template-uri ${templates}` : `--template-file ${templates}`
            : undefined,
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
                warning(data.toString());
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
                warning(data.toString());
            },
        }
    }

    // validate the deployment
    info("Validating template...")
    var code = await exec(`"${azPath}" deployment sub validate ${azDeployParameters} -o json`, [], validateOptions);
    if (validationOnly && code != 0) {
        throw new Error("Template validation failed")
    } else if (code != 0) {
        warning("Template validation failed.")
    }

    // execute the deployment
    info("Creating deployment...")
    await exec(`"${azPath}" deployment sub create ${azDeployParameters} -o json`, [], deployOptions);

    // Parse the Outputs
    info("Parsing outputs...")
    return ParseOutputs(commandOutput)
}