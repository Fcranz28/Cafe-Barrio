param([switch]$Demo, [switch]$Test)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
Set-Location $taskRoot
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
