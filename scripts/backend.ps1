param([switch]$Demo, [switch]$Test)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
Set-Location $taskRoot
# Local dotenv values, without printing secrets or overwriting explicit environment variables.
if (Test-Path -LiteralPath (Join-Path $taskRoot '.env')) {
    foreach ($taskLine in Get-Content -LiteralPath (Join-Path $taskRoot '.env')) {
        if ($taskLine -match '^([A-Z_]+)=(.*)$') {
            $taskName=$Matches[1]
            $taskValue=$Matches[2].Trim().Trim('"').Trim("'")
            if (-not [Environment]::GetEnvironmentVariable($taskName)) {
                [Environment]::SetEnvironmentVariable($taskName,$taskValue,'Process')
            }
        }
    }
}
if (-not $env:JAVA_HOME) {
    $taskJava=Get-Command java -ErrorAction SilentlyContinue
    if ($taskJava) {
        $env:JAVA_HOME=Split-Path (Split-Path $taskJava.Source -Parent) -Parent
    } else {
        $taskJbr=Get-ChildItem 'C:/Program Files/JetBrains' -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'jbr' } |
            Where-Object { Test-Path (Join-Path $_ 'bin/java.exe') } |
            Select-Object -First 1
        if (-not $taskJbr) { throw 'Configura JAVA_HOME con un JDK 17 o superior.' }
        $env:JAVA_HOME=$taskJbr
    }
}
if ($Test) {
    & ./mvnw.cmd -B -ntp test
} elseif ($Demo) {
    & ./mvnw.cmd -B -ntp spring-boot:run '-Dspring-boot.run.profiles=demo'
} else {
    & ./mvnw.cmd -B -ntp spring-boot:run
}
exit $LASTEXITCODE
