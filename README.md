# GitHub Action for Azure Resource Manager (ARM) deployment

A GitHub Action to deploy ARM templates. With this action you can automate your workflow to deploy ARM templates and manage Azure resources.

This action can be used to deploy Azure Resource Manager templates at different [deployment scopes](https://docs.microsoft.com/bs-latn-ba/Azure/azure-resource-manager/resource-group-template-deploy-rest#deployment-scope) -  resource group deployment scope, subscription deployment scope and management group deployment scopes. 

## Dependencies

* [Azure Login](https://github.com/Azure/login) Login with your Azure credentials
* [Checkout](https://github.com/actions/checkout) To checks-out your repository so the workflow can access any specified ARM template.

## Inputs

* `scope`: **Required** Provide the scope of the deployment. Valid values are: `resourcegroup`(default) , `subscription`, `managementgroup`.
* `templates`: **Required** Specify the path or URL to the Azure Resource Manager template.
* `subscriptionId`: Provide the Id of the subscription which should be used.Only required for scope `resourcegroup` & `subscription`. 
* `resourceGroupName`: Provide the name of a resource group. Only required for Resource Group Scope
* `region`: Provide the target region, only required for Management Group or Subscription deployments.

* `deploymentMode`: `Incremental`(default) (only add resources to resource group) or `Complete` (remove extra resources from resource group) or `Validate`
* `deploymentName` Specifies the name of the resource group deployment to create.
* `parameters` Supply deployment parameter values or local as well as remote value files.   



## Outputs
Every template output will be exported as output. 

## Usage

```yml
- uses: azure/arm-deploy@v1
  with:
    scope: resourcegroup
    subscriptionId: <YourSubscriptionId>
    resourceGroupName: <YourResourceGroup>
    templates: <path/to/azuredeploy.json>
```

## Example

```yml
on: [push]
name: AzureLoginSample

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - uses: azure/arm-deploy@v1
      with:
        scope: resourcegroup
        subscriptionId: e1046c08-7072-****-****-************
        resourceGroupName: github-action-arm-rg
        templates: ./azuredeploy.json
        parameters: storageAccountType=Standard_LRS
```

## Another example on how to use this Action to use get the output of ARM template
In this exmaple, our template outputs `containerName`.

## Steps
```yaml
- uses: azure/arm-deploy@v1
  id: deploy
  with:
    scope: resourcegroup
    subscriptionId: e1046c08-7072-****-****-************
    resourceGroupName: azurearmaction
    templates: examples/template/template.json
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


