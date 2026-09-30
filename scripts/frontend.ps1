param([ValidateSet('Start','Build','Test','Install')][string]$Action='Start')
$ErrorActionPreference='Stop'
Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) 'frontend')
function Test-TaskNode([string]$Executable) {
    if (-not $Executable -or -not (Test-Path $Executable)) { return $false }
    $taskVersion=[version]((& $Executable --version).TrimStart('v'))
    return (($taskVersion.Major -eq 22 -and $taskVersion -ge [version]'22.22.3') -or
            ($taskVersion.Major -eq 24 -and $taskVersion -ge [version]'24.15.0') -or
            $taskVersion.Major -ge 26)
}
$taskNodeCommand=Get-Command node -ErrorAction SilentlyContinue
$taskNode=if ($taskNodeCommand) { $taskNodeCommand.Source } else { '' }
if (-not (Test-TaskNode $taskNode)) {
    $taskNode=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
}
if (-not (Test-TaskNode $taskNode)) { throw 'Instala Node 22.22.3+, 24.15.0+ o 26+ para Angular 22.' }
$env:PATH=(Split-Path $taskNode -Parent)+';'+$env:PATH
if ($Action -eq 'Install' -or -not (Test-Path 'node_modules')) {
    $taskNpm=Get-Command npm.cmd -ErrorAction Stop
    $taskNpmCli=Join-Path (Split-Path $taskNpm.Source -Parent) 'node_modules/npm/bin/npm-cli.js'
    & $taskNode $taskNpmCli ci --no-fund --no-audit
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    if ($Action -eq 'Install') { exit 0 }
}
switch ($Action) {
    'Start' { & $taskNode node_modules/@angular/cli/bin/ng.js serve --proxy-config proxy.conf.json --host 127.0.0.1 }
    'Build' { & $taskNode node_modules/@angular/cli/bin/ng.js build }
    'Test' { & $taskNode node_modules/@angular/cli/bin/ng.js test --watch=false }
}
exit $LASTEXITCODE
