# GitHub Action for Azure Resource Manager (ARM) deployments

> 🚀 **New Release Alert!**  
> We are excited to announce a new implementation of our GitHub Action for Azure Resource Manager (ARM) deployments! To improve the deployment and management of Azure resources, we’ve launched [azure/bicep-deploy](https://github.com/azure/bicep-deploy), which supports both Bicep and ARM templates, along with first-party Deployment Stacks support, making it easier than ever to manage your infrastructure directly from GitHub workflows.
>  
> ⚠️ **Deprecation Notice:** This repository and action (azure/arm-deploy) will be **deprecated in the future**. We recommend switching to [azure/bicep-deploy](https://github.com/azure/bicep-deploy) for ongoing support and new features.
> 

A GitHub Action to deploy ARM templates. With this action you can automate your workflow to deploy ARM templates and manage Azure resources.

This action can be used to deploy Azure Resource Manager templates at different [deployment scopes](https://docs.microsoft.com/bs-latn-ba/Azure/azure-resource-manager/resource-group-template-deploy-rest#deployment-scope) -  resource group deployment scope, subscription deployment scope and management group deployment scopes. 

By default, the action only parses the output and does not print them out. In order to get the values of ```outputs```use [this](https://github.com/Azure/arm-deploy#another-example-on-how-to-use-this-action-to-get-the-output-of-arm-template).

## Dependencies

* [Azure Login](https://github.com/Azure/login) Login with your Azure credentials
* [Checkout](https://github.com/actions/checkout) To checks-out your repository so the workflow can access any specified ARM template.

## Inputs

* `scope`: Provide the scope of the deployment. Valid values are: `resourcegroup`(default) , `tenant`, `subscription`, `managementgroup`. 
* `resourceGroupName`: **Conditional** Provide the name of a resource group. Only required for Resource Group Scope
* `subscriptionId`: **Conditional** Provide a value to override the subscription ID set by [Azure Login](https://github.com/Azure/login).
* `managementGroupId`: **Conditional** Specify the Management Group ID, only required for Management Group Deployments.
* `region`: **Conditional** Provide the target region, only required for Tenant, Management Group or Subscription deployments.
* `template`: **Required** Specify the path or URL to the Azure Resource Manager template.
* `parameters`: Specify the path or URL to the Azure Resource Manager deployment parameter values file (local / remote) and/or specify local overrides.  
* `deploymentMode`: `Incremental`(default) (only add resources to resource group) or `Complete` (remove extra resources from resource group) or `Validate` (only validates the template). 
* `deploymentName`: Specifies the name of the resource group deployment to create.
* `failOnStdErr`: Specify whether to fail the action if some data is written to stderr stream of az cli. Valid values are: true, false. Default value set to true.
* `additionalArguments`: Specify any additional arguments for the deployment. These arguments will be ignored while `validating` the template.
* `maskedOutputs`: Specify list of output keys that its value need to be register to github action as secret. (checkout https://github.com/actions/toolkit/issues/184#issuecomment-1198653452 for valid multiline string)

  A good way to use additionalArguments would be to send optional parameters like `--what-if` or `--what-if-exclude-change-types`. [Read more about this here](https://docs.microsoft.com/en-us/cli/azure/deployment?view=azure-cli-latest#az-deployment-create-optional-parameters)
## Outputs
Every template output will either be exported as output if output is a json object else will be consoled out where output is not a json object. 

## Usage

```yml
- uses: azure/arm-deploy@v2
  with:
    subscriptionId: <YourSubscriptionId>
    resourceGroupName: <YourResourceGroup>
    template: <path/to/azuredeploy.json>
```

## Example

```yaml
on: [push]
name: AzureARMSample

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - uses: azure/arm-deploy@v2
      with:
        resourceGroupName: github-action-arm-rg
        template: ./azuredeploy.json
        parameters: examples/template/parameters.json storageAccountType=Standard_LRS sqlServerPassword=${{ secrets.SQL_SERVER }}
        additionalArguments: "--what-if --rollback-on-error --what-if-exclude-change-types Create Ignore"
```

## Another example which ensures the Azure Resource Group exists before ARM deployment
In the preceeding example there is a pre-requisite that an existing Azure Resource Group named ```github-action-arm-rg``` must already exist.  

The below example makes use of the [Azure CLI Action](https://github.com/marketplace/actions/azure-cli-action) to ensure the resource group is created before doing an ARM deployment.  Note that the command `az group create` is idempotent, so it will run sucessfully even if the group already exists.

## Steps
When generating your credentials (in this example we store in a secret named ```AZURE_CREDENTIALS```) you will need to specify a scope at the subscription level.

```azurecli
az ad sp create-for-rbac --name "{sp-name}" --sdk-auth --role contributor --scopes /subscriptions/{subscription-id}
```

See [Configure deployment credentials](https://github.com/marketplace/actions/azure-login#configure-deployment-credentials).

## Example
```yaml
on: [push]
name: AzureARMSample

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      ResourceGroupName: github-action-arm-rg
      ResourceGroupLocation: "australiaeast"
    steps:
    - uses: actions/checkout@master
    - uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - uses: Azure/CLI@v2
      with:
        inlineScript: |
          #!/bin/bash
          az group create --name ${{ env.ResourceGroupName }} --location ${{ env.ResourceGroupLocation }}
          echo "Azure resource group created"
    - uses: azure/arm-deploy@v2
      with:
        resourceGroupName: ${{ env.ResourceGroupName }}
        template: ./azuredeploy.json
        parameters: storageAccountType=Standard_LRS
```

## Another example on how to use this Action to get the output of ARM template
In this example, our template outputs `containerName`.

## Steps
```yaml
- uses: azure/arm-deploy@v2
  id: deploy
  with:
    resourceGroupName: azurearmaction
    template: examples/template/template.json
    parameters: examples/template/parameters.json
    deploymentName: github-advanced-test
```
Here we see a normal use of the Action, we pass the template as json file as well as the parameters. If we look into the `template.json` File we can see at the very bottom the defined outputs:
```json
{
  ...
  "outputs": {
    ...
    "containerName": {
      "type": "string",
      "value": "[parameters('containerName')]"
    }
  }
}
```
And we know our Action writes this output(s) to an action output variable with the same name, we can access it using `${{ steps.deploy.outputs.containerName }}` (Note: `deploy` comes from the `id` field from above.)   

If we now add a Shell script with a simple echo from that value, we can see that on the console the containername to be printed.

```yaml
- run: echo ${{ steps.deploy.outputs.containerName }}
```

ARM Deploy Actions is supported for the Azure public cloud as well as Azure government clouds ('AzureUSGovernment' or 'AzureChinaCloud') and Azure Stack ('AzureStack') Hub. Before running this action, login to the respective Azure Cloud  using [Azure Login](https://github.com/Azure/login) by setting appropriate value for the `environment` parameter.

## Example on how to use failOnStdErr
In this example, we are setting `failOnStdErr` to false. 

```yaml
- uses: azure/arm-deploy@v2
  id: deploy
  with:
    resourceGroupName: azurearmaction
    template: examples/template/template.json
    parameters: examples/template/parameters.json
    deploymentName: github-advanced-test
    failOnStdErr: false
```
`failOnStdErr` equals true implied that if some data is written to stdErr and exit code from az-cli is 0, then action execution will fail.

`failOnStdErr` equals false implies that if some data is written to stdErr and return code from az-cli is 0, then action will continue execution. This input is added to support cases where stdErr is being used to stream warning or progress info. 

Non zero Exit code will always lead to failure of action irrespective the value of `failOnStdErr`.

For more examples, refer : [Example Guide](https://github.com/Azure/arm-deploy/blob/main/examples/exampleGuide.md)

## Az CLI dependency
Internally in this action, we use azure CLI and execute `az login` with the credentials provided through secrets. In order to validate the new az CLI releases for this action, [canary test workflow](.github/workflows/azure-login-canary.yml) is written which will execute the action on [az CLI's edge build](https://github.com/Azure/azure-cli#edge-builds) which will fail incase of any breaking change is being introduced in the new upcoming release. The test results can be posted on a slack or teams channel using the corresponding integrations. Incase of a failure, the concern will be raised to [azure-cli](https://github.com/Azure/azure-cli) for taking a necessary action and also the latest CLI installation will be postponed in [Runner VMs](https://github.com/actions/virtual-environments) as well for hosted runner to prevent the workflows failing due to the new CLI changes.

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
