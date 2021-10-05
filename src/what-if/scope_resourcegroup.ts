import * as core from '@actions/core';
import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';

export async function WhatIfResourceGroupScope(azPath: string, resourceGroupName: string, template: string, deploymentName: string, parameters: string, failOnStdErr: Boolean, excludeChangeTypes: String): Promise<Outputs> {
    // Check if resourceGroupName is set
    if (!resourceGroupName) {
        throw Error("ResourceGroup name must be set.")
    }

    // create the parameter list
    const azDeployParameters = [
        resourceGroupName ? `--resource-group ${resourceGroupName}` : undefined,
        template ?
            template.startsWith("http") ? `--template-uri ${template}` : `--template-file ${template}`
            : undefined,
        deploymentName ? `--name "${deploymentName}"` : undefined,
        parameters ? `--parameters ${parameters}` : undefined,
        excludeChangeTypes ? `--exclude-change-types ${excludeChangeTypes}` : undefined
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
                if(error && error.trim().length !== 0)
                {
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

    core.info("Preview Changes")
    var deploymentCode = await exec(`"${azPath}" deployment group what-if ${azDeployParameters} -o json`, [], deployOptions);
    
    if (deploymentCode != 0) {
        throw new Error("What-If failed.")
    }
    
    if(commandStdErr && failOnStdErr) {
        throw new Error("Deployment process failed as some lines were written to stderr");
    }

    core.info(commandOutput);
    return {}
}