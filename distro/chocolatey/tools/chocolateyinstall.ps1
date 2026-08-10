$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'cleer'
  fileType       = 'exe'
  url64bit       = 'https://github.com/ayyesu/CLEER/releases/download/v0.1.0/CLEER-0.1.0-win.exe'
  softwareName   = 'CLEER*'
  checksum64     = ''
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
