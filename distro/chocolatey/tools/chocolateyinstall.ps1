$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'cleer'
  fileType       = 'exe'
  url64bit       = 'https://github.com/ayyesu/CLEER/releases/download/v0.1.7/CLEER-0.1.7-win.exe'
  softwareName   = 'CLEER*'
  checksum64     = 'bebb9b135977337e032aeb47a0feb72b748f79daa8564d0ddb20f94efa25f995'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
