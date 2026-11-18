param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
try { $Host.UI.RawUI.WindowTitle = 'MayLendy - Configure GitHub and Cloudflare' } catch { }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$vaultDir = Join-Path $env:APPDATA 'MayLendyDeploy'
$vaultFile = Join-Path $vaultDir 'credentials.json'
$repo = 'Niiiii602/chaozhoulaotesi'
function Get-Plain([Security.SecureString]$Secure) {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function Read-Key([string]$Name,[string]$Prompt,$Saved) {
    $plain = [Environment]::GetEnvironmentVariable($Name,'Process')
    if ([string]::IsNullOrWhiteSpace($plain)) { $plain = [Environment]::GetEnvironmentVariable($Name,'User') }
    if ($Name -eq 'GITHUB_TOKEN' -and [string]::IsNullOrWhiteSpace($plain)) { $plain = $env:GH_TOKEN }
    if ([string]::IsNullOrWhiteSpace($plain) -and $Saved) {
        try { $plain = Get-Plain (ConvertTo-SecureString $Saved) } catch { $plain = $null }
    }
    if ([string]::IsNullOrWhiteSpace($plain) -and $CheckOnly) { throw "$Name is not configured." }
    if ([string]::IsNullOrWhiteSpace($plain)) { $plain = Get-Plain (Read-Host $Prompt -AsSecureString) }
    if ([string]::IsNullOrWhiteSpace($plain)) { throw "$Name was empty." }
    return $plain.Trim()
}
function Get-Api([string]$Uri,[hashtable]$Headers) {
    try { Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Get -TimeoutSec 25 }
    catch { throw "API validation failed for $(([uri]$Uri).Host). Check token validity and permissions. The token has not been printed." }
}
try {
    Write-Host 'MayLendy - GitHub and Cloudflare credentials' -ForegroundColor Cyan
    Write-Host 'Input is hidden. Never paste a token into the chat.'
    Write-Host 'GitHub: selected repository Niiiii602/chaozhoulaotesi, Contents: Read and write.'
    Write-Host 'Cloudflare: Workers Scripts Edit + Account Settings Read. No Global API Key needed.'
    Write-Host 'Keys are saved using Windows DPAPI for this Windows user; not in the repository.'
    $saved = $null
    if (Test-Path -LiteralPath $vaultFile) { $saved = Get-Content -LiteralPath $vaultFile -Raw | ConvertFrom-Json }
    if ($CheckOnly -and -not $saved -and -not $env:GITHUB_TOKEN -and -not $env:GH_TOKEN) { throw 'No configured credentials. Run this script without -CheckOnly.' }
    $gh = Read-Key 'GITHUB_TOKEN' 'Paste GitHub token (hidden)' $saved.github
    $ghHeaders = @{Authorization="Bearer $gh";Accept='application/vnd.github+json';'X-GitHub-Api-Version'='2022-11-28';'User-Agent'='MayLendy-Deploy'}
    $user = Get-Api 'https://api.github.com/user' $ghHeaders
    $repository = Get-Api "https://api.github.com/repos/$repo" $ghHeaders
    if (-not $repository.permissions.push) { throw 'GitHub token cannot write to the selected repository. Grant Contents Read and write.' }
    Write-Host "GitHub validated: $($user.login); selected repository is writable." -ForegroundColor Green
    $cf = Read-Key 'CLOUDFLARE_API_TOKEN' 'Paste Cloudflare API token (hidden)' $saved.cloudflare
    $cfHeaders = @{Authorization="Bearer $cf";'User-Agent'='MayLendy-Deploy'}
    try { $verified = Get-Api 'https://api.cloudflare.com/client/v4/user/tokens/verify' $cfHeaders }
    catch {
        if (-not $saved.accountId) { throw 'For an account-scoped token, configure the account ID first.' }
        $verified = Get-Api "https://api.cloudflare.com/client/v4/accounts/$($saved.accountId)/tokens/verify" $cfHeaders
    }
    if (-not $verified.success -or $verified.result.status -ne 'active') { throw 'Cloudflare API token is not active.' }
    $accounts = Get-Api 'https://api.cloudflare.com/client/v4/accounts?per_page=50' $cfHeaders
    if (-not $accounts.success) { throw 'Cannot read Cloudflare accounts. Add Account Settings Read for the selected account.' }
    $account = $null
    foreach ($candidate in $accounts.result) {
        try {
            $scripts = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$($candidate.id)/workers/scripts" -Headers $cfHeaders -TimeoutSec 25
            if ($scripts.success -and @($scripts.result | Where-Object {$_.id -eq 'chaozhoulaotesi'}).Count -gt 0) { $account = $candidate; break }
        } catch { }
    }
    if (-not $account) { throw 'The token could not locate existing Worker chaozhoulaotesi. Check account scope and Workers Scripts permissions.' }
    New-Item -ItemType Directory -Force -Path $vaultDir | Out-Null
    $record = [ordered]@{version=1;github=(ConvertTo-SecureString $gh -AsPlainText -Force | ConvertFrom-SecureString);cloudflare=(ConvertTo-SecureString $cf -AsPlainText -Force | ConvertFrom-SecureString);accountId=$account.id;repository=$repo;githubLogin=$user.login;validatedAt=(Get-Date).ToUniversalTime().ToString('o')}
    $temp = $vaultFile + '.tmp'
    $record | ConvertTo-Json | Set-Content -LiteralPath $temp -Encoding UTF8
    Move-Item -LiteralPath $temp -Destination $vaultFile -Force
    $gh = $null; $cf = $null; $ghHeaders = $null; $cfHeaders = $null
    Write-Host 'SUCCESS: Both credentials validated and encrypted locally.' -ForegroundColor Green
    Write-Host 'Return to PI-Desktop and say: Credentials configured. Continue deployment.'
    Write-Host "Credential store: $vaultFile"
    if (-not $CheckOnly) { Read-Host 'Press Enter to close' | Out-Null }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host 'Nothing was deployed. No credentials were printed.'
    if (-not $CheckOnly) { Read-Host 'Press Enter to close, correct permissions and run again' | Out-Null }
    exit 1
}
