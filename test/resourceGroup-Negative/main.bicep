param storageAccountName string

param location string = resourceGroup().location

resource sa 'Microsoft.Storage/storageAccounts@2019-06-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Premium_ZRS'
  }
  kind: 'StorageV2'
}
