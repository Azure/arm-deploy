import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';
import * as core from '@actions/core';

export async function DeployManagementGroupScope(azPath: string, region: string, template: string, deploymentMode: string, deploymentName: string, parameters: string, managementGroupId: string, failOnStdErr: Boolean, whatIf: Boolean, whatIfExcludeChangeTypes: string, whatIfResultFormat: string): Promise<Outputs> {
    // Check if region is set
    if (!region) {
        throw Error("Region must be set.")
    }

    // check if mode is set as this will be ignored
    if (deploymentMode && deploymentMode != "validate") {
        core.warning("This deployment mode is not supported for management group scoped deployments, this parameter will be ignored!")
    }
    // create the parameter list
    const azDeployParameters = [
        region ? `--location "${region}"` : undefined,
        template ?
            template.startsWith("http") ? `--template-uri ${template}` : `--template-file ${template}`
            : undefined,
        managementGroupId ? `--management-group-id "${managementGroupId}"` : undefined,
        deploymentName ? `--name "${deploymentName}"` : undefined,
        parameters ? `--parameters ${parameters}` : undefined,
        whatIf ? '--what-if' : undefined,
        whatIfExcludeChangeTypes ? `--what-if-exclude-change-types ${whatIfExcludeChangeTypes}` : undefined,
        whatIfResultFormat ? `--what-if-result-format ${whatIfResultFormat}` : undefined,
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
    if (!whatIf) {
        core.info("Validating template...")
        var code = await exec(`"${azPath}" deployment mg validate ${azDeployParameters} -o json`, [], validateOptions);
        if (deploymentMode === "validate" && code != 0) {
            throw new Error("Template validation failed.")
        } else if (code != 0) {
            core.warning("Template validation failed.")
        }
    }
    
    if (deploymentMode != "validate") {
        // execute the deployment
        core.info("Creating deployment...")
        var deploymentCode = await exec(`"${azPath}" deployment mg create ${azDeployParameters} -o json`, [], deployOptions);

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
