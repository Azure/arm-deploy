// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "path";
import { coreMock, mockInputs } from "./mocks";
import { main } from "../src/main";
import { randomBytes } from "crypto";

const liveTestTimeout = 5 * 60 * 1000; // 5 minutes

function getRandomDeploymentName(prefix: string) {
  const suffix = randomBytes(5).toString("hex");

  return `${prefix}-${suffix}`;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("live tests", () => {
  it("resource group scope - positive", async () => {
    mockInputs({
      scope: 'resourcegroup',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: 'arm-deploy-e2e',
      region: '',
      template: path.resolve(__dirname, './json/inputs-outputs.json'),
      parameters: path.resolve(__dirname, './json/inputs-outputs.parameters.json'),
      deploymentMode: 'Complete',
      deploymentName: getRandomDeploymentName('test-rg'),
      additionalArguments: '',
      failOnStdErr: false,
    });

    await main();
    expect(coreMock.setFailed).not.toHaveBeenCalled();
  }, liveTestTimeout);
  
  it("resource group scope - negative", async () => {
    mockInputs({
      scope: 'resourcegroup',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: 'arm-deploy-e2e',
      region: '',
      parameters: path.resolve(__dirname, './resourceGroup-Negative/main.bicepparam'),
      deploymentMode: 'Complete',
      deploymentName: getRandomDeploymentName('test-rg'),
      additionalArguments: '',
      failOnStdErr: false,
    });

    await main();
    expect(coreMock.setFailed).toHaveBeenCalled();
  }, liveTestTimeout);
  
  // subscription scope auth not currently supported in live tests
  xit("subscription scope - positive", async () => {
    mockInputs({
      scope: 'subscription',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: '',
      region: 'centralus',
      template: 'https://raw.githubusercontent.com/Azure/azure-docs-json-samples/master/azure-resource-manager/emptyrg.json',
      parameters: 'rgName=demoResourceGroup rgLocation=centralus',
      deploymentMode: '',
      deploymentName: getRandomDeploymentName('test-sub'),
      additionalArguments: '',
      failOnStdErr: false,
    });

    await main();
    expect(coreMock.setFailed).not.toHaveBeenCalled();
  }, liveTestTimeout);

  // subscription scope auth not currently supported in live tests
  xit("subscription scope - negative", async () => {
    mockInputs({
      scope: 'subscription',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: '',
      region: 'centralus',
      template: path.resolve(__dirname, './subscription-Negative/template.json'),
      parameters: 'rgName=demoResourceGroup rgLocation=centralus',
      deploymentMode: '',
      deploymentName: getRandomDeploymentName('test-sub'),
      additionalArguments: '',
      failOnStdErr: false,
    });

    await main();
    expect(coreMock.setFailed).toHaveBeenCalled();
  }, liveTestTimeout);

  it("validate mode - positive", async () => {
    mockInputs({
      scope: 'resourcegroup',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: 'arm-deploy-e2e',
      region: '',
      template: path.resolve(__dirname, './json/inputs-outputs.json'),
      parameters: path.resolve(__dirname, './json/inputs-outputs.parameters.json'),
      deploymentMode: 'Validate',
      deploymentName: getRandomDeploymentName('test-rg'),
      additionalArguments: '',
      failOnStdErr: false,
    });

    await main();
    expect(coreMock.setFailed).not.toHaveBeenCalled();
  }, liveTestTimeout);

  it("can deploy .bicep files", async () => {
    mockInputs({
      scope: 'resourcegroup',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: 'arm-deploy-e2e',
      region: '',
      template: path.resolve(__dirname, './bicep/inputs-outputs.bicep'),
      parameters: path.resolve(__dirname, './bicep/inputs-outputs.parameters.json'),
      deploymentName: getRandomDeploymentName('test-rg'),
      failOnStdErr: false,
    });

    await main();

    expect(coreMock.setFailed).not.toHaveBeenCalled();
    expect(coreMock.setOutput).toHaveBeenCalledWith('stringOutput', 'hello world');
    expect(coreMock.setOutput).toHaveBeenCalledWith('intOutput', 42);
    expect(coreMock.setOutput).toHaveBeenCalledWith('objectOutput', {
      prop1: 'value1',
      prop2: 'value2',
    });
  }, liveTestTimeout);

  it("can deploy .bicepparam files", async () => {
    mockInputs({
      scope: 'resourcegroup',
      managementGroupId: '',
      subscriptionId: process.env.SUBSCRIPTION_ID ?? '',
      resourceGroupName: 'arm-deploy-e2e',
      region: '',
      parameters: path.resolve(__dirname, './bicep/inputs-outputs.bicepparam'),
      deploymentName: getRandomDeploymentName('test-rg'),
      failOnStdErr: false,
    });

    await main();

    expect(coreMock.setFailed).not.toHaveBeenCalled();
    expect(coreMock.setOutput).toHaveBeenCalledWith('stringOutput', 'hello world');
    expect(coreMock.setOutput).toHaveBeenCalledWith('intOutput', 42);
    expect(coreMock.setOutput).toHaveBeenCalledWith('objectOutput', {
      prop1: 'value1',
      prop2: 'value2',
    });
  }, liveTestTimeout);
});