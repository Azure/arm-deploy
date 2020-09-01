import * as core from '@actions/core';

export type Outputs = { [index: string]: { value: string } }
export function ParseOutputs(commandOutput: string): Outputs {
    // parse the result and save the outputs
    var result = JSON.parse(commandOutput) as { properties: { outputs: Outputs } }
    var object = result.properties.outputs
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            core.setOutput(key, object[key].value)
        }
    }

    return object
}