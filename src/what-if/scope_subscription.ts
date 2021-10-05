import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { ParseOutputs, Outputs } from '../utils/utils';
import * as core from '@actions/core';

export async function WhatIfSubscriptionScope(azPath: string, region: string, template: string, deploymentName: string, parameters: string, failOnStdErr: Boolean, excludeChangeTypes: String): Promise<Outputs> {
    // Check if region is set
    if (!region) {
        throw Error("Region must be set.")
    }

    // create the parameter list
    const azDeployParameters = [
        region ? `--location "${region}"` : undefined,
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
    var deploymentCode = await exec(`"${azPath}" deployment sub what-if ${azDeployParameters} -o json`, [], deployOptions);
    
    if (deploymentCode != 0) {
        throw new Error("What-If failed.")
    }
    
    if(commandStdErr && failOnStdErr) {
        throw new Error("Deployment process failed as some lines were written to stderr");
    }
    
    core.info(commandOutput);
    return {}
}