import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';
import * as core from '@actions/core';

export async function DeploySubscriptionScope(azPath: string, region: string, template: string, deploymentMode: string, deploymentName: string, parameters: string): Promise<Outputs> {
    // Check if region is set
    if (!region) {
        throw Error("Region must be set.")
    }

    // check if mode is set as this will be ignored
    if (deploymentMode && deploymentMode.toLowerCase() != "validate") {
        core.warning("This deployment mode is not supported for subscription scoped deployments, this parameter will be ignored!")
    }

    // create the parameter list
    const azDeployParameters = [
        region ? `--location "${region}"` : undefined,
        template ?
            template.startsWith("http") ? `--template-uri ${template}` : `--template-file ${template}`
            : undefined,
        deploymentName ? `--name "${deploymentName}"` : undefined,
        parameters ? `--parameters ${parameters}` : undefined
    ].filter(Boolean).join(' ');

    // configure exec to write the json output to a buffer
    let commandOutput = '';
    const deployOptions: ExecOptions = {
        silent: true,
        ignoreReturnCode: true,
        failOnStdErr: true,
        listeners: {
            stderr: (data: BufferSource) => {
                core.error(data.toString());
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
    core.info("Validating template...")
    var code = await exec(`"${azPath}" deployment sub validate ${azDeployParameters} -o json`, [], validateOptions);
    if (deploymentMode.toLowerCase() === "validate" && code != 0) {
        throw new Error("Template validation failed.")
    } else if (code != 0) {
        core.warning("Template validation failed.")
    }

    if (deploymentMode.toLowerCase() != "validate") {
        // execute the deployment
        core.info("Creating deployment...")
        var deploymentCode = await exec(`"${azPath}" deployment sub create ${azDeployParameters} -o json`, [], deployOptions);
        if (deploymentCode != 0) {
            core.error("Deployment failed.")
        }
        core.debug(commandOutput);

        // Parse the Outputs
        core.info("Parsing outputs...")
        return ParseOutputs(commandOutput)
    }
    return {}
}