Following are some examples in which you can use the ARM action. 


Different scopes: 
 
**Resource group (Default group)**

    scope: resourcegroup 
    subscriptionId: c01d26c9-****-****-****-************ 
    resourceGroupName**: demoGroup 
    template: examples/template/template.json

There are a lot of [sample templates](https://github.com/Azure/azure-quickstart-templates) available which can be used for deployment.  

**Subscription**
 
    scope: subscription 
    subscriptionId: c01d26c9-****-****-****-************ 
    region: centralus 
    template: https://raw.githubusercontent.com/Azure/azure-docs-json-samples/master/azure-resource-manager/emptyRG.json
    parameters: rgName=demoResourceGroup rgLocation=centralus

More [Sample templates](https://github.com/Azure/azure-quickstart-templates/tree/master/subscription-deployments) can be found here. 

**Management group**

    scope: managementgroup 
    managementGroupId: demoId 
    region: centralus 
    template: https://teststorage.blob/template.json
    parameters: https://teststorage.blob/parameters.json

[Sample templates](https://github.com/Azure/azure-quickstart-templates/tree/master/managementgroup-deployments) can be found here.
**Note:** Parameter value specified in parameter file can be overridden by specifying it along with parameter file name.
Example:
 parameters: https://teststorage.blob/parameters.json parameterName=parameterValue

**Things to keep in mind:** 

*   For all scenarios, you can either paste the template in your repo and provide its location or can use the URI of the template directly. Same thing applies to providing parameters.
*   Authorization issue can be due to lack of proper access to the secret AZURE_CREDENTIALS. So, ensure that the secret has proper rights.
*   DeploymentMode is a parameter required only in case of Resource group deployments. It can either be incremental(default) or complete.
