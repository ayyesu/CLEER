$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'cleer'
  fileType       = 'exe'
  softwareName   = 'CLEER*'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Uninstall-ChocolateyPackage @packageArgs
