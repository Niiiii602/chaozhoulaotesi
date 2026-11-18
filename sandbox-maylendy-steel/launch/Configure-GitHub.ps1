$ErrorActionPreference='Stop'
try {
 $Host.UI.RawUI.WindowTitle='MayLendy - GitHub credential'
 Write-Host 'GitHub token: selected repository Niiiii602/chaozhoulaotesi, Contents Read and write.'
 Write-Host 'Input is hidden. The token will be saved with Windows DPAPI, never in this project.'
 $secure=Read-Host 'Paste GitHub token' -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try {$token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $headers=@{Authorization="Bearer $token";Accept='application/vnd.github+json';'X-GitHub-Api-Version'='2022-11-28';'User-Agent'='MayLendy-release'}
 $repo=Invoke-RestMethod -Uri 'https://api.github.com/repos/Niiiii602/chaozhoulaotesi' -Headers $headers -TimeoutSec 25
 if (-not $repo.permissions.push) {throw 'Repository write permission was not confirmed.'}
 $dir=Join-Path $env:APPDATA 'MayLendyDeploy';New-Item -ItemType Directory -Force -Path $dir | Out-Null
 $path=Join-Path $dir 'credentials.json'
 if (Test-Path -LiteralPath $path) {$vault=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json} else {$vault=[pscustomobject]@{version=1;repository='Niiiii602/chaozhoulaotesi'}}
 $vault | Add-Member -NotePropertyName github -NotePropertyValue ($secure | ConvertFrom-SecureString) -Force
 $vault | ConvertTo-Json | Set-Content -LiteralPath ($path+'.tmp') -Encoding UTF8
 Move-Item -LiteralPath ($path+'.tmp') -Destination $path -Force
 $token=$null;$headers=$null
 Write-Host 'SUCCESS: GitHub credential validated and encrypted. Return to PI-Desktop to continue GitHub sync.' -ForegroundColor Green
} catch {Write-Host 'GitHub configuration failed. Check token and selected repository permissions; no token was printed.' -ForegroundColor Red}
Read-Host 'Press Enter to close' | Out-Null
