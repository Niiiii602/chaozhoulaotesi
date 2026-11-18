$ErrorActionPreference='Stop'
try {
 $Host.UI.RawUI.WindowTitle='LAOTES - Cloudflare credential'
 Write-Host 'The previous Cloudflare token is no longer accepted. Paste a replacement token below.'
 Write-Host 'Permissions: Workers Scripts Edit, Account Settings Read, scoped to the existing account.'
 Write-Host 'Input is hidden; existing GitHub configuration will be preserved.'
 $vaultPath=Join-Path $env:APPDATA 'MayLendyDeploy\credentials.json'
 if (-not (Test-Path -LiteralPath $vaultPath)) {throw 'Existing account configuration not found.'}
 $vault=Get-Content -LiteralPath $vaultPath -Raw|ConvertFrom-Json
 $secure=Read-Host 'Paste replacement Cloudflare token' -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try {$token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
 $headers=@{Authorization="Bearer $token";'User-Agent'='LAOTES-domain-repair'}
 $r=Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$($vault.accountId)/workers/scripts" -Headers $headers -TimeoutSec 25
 if (-not $r.success -or -not @($r.result|Where-Object {$_.id -eq 'chaozhoulaotesi'}).Count) {throw 'The existing Worker was not accessible.'}
 $vault|Add-Member -NotePropertyName cloudflare -NotePropertyValue ($secure|ConvertFrom-SecureString) -Force
 $vault|Add-Member -NotePropertyName validatedAt -NotePropertyValue ((Get-Date).ToUniversalTime().ToString('o')) -Force
 $vault|ConvertTo-Json|Set-Content -LiteralPath ($vaultPath+'.tmp') -Encoding UTF8
 Move-Item -LiteralPath ($vaultPath+'.tmp') -Destination $vaultPath -Force
 $token=$null;$headers=$null
 Write-Host 'SUCCESS: replacement token verified and encrypted. Return to PI-Desktop to continue publishing.' -ForegroundColor Green
}catch{Write-Host 'Configuration failed. Check token validity and permissions. No token was printed.' -ForegroundColor Red}
Read-Host 'Press Enter to close'|Out-Null
