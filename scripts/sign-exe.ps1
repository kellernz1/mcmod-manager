param(
  [string]$ExePath = "release\MCMod-Manager-0.1.0.exe",
  [string]$Thumbprint = "",
  [string]$TimestampServer = "http://timestamp.digicert.com"
)

$resolvedExe = Resolve-Path -LiteralPath $ExePath -ErrorAction Stop

if ([string]::IsNullOrWhiteSpace($Thumbprint)) {
  $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
    Where-Object { $_.Subject -like "*MCMod Manager Code Signing*" } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
} else {
  $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
    Where-Object { $_.Thumbprint -eq $Thumbprint } |
    Select-Object -First 1
}

if (-not $cert) {
  throw "No code signing certificate found. Run scripts\create-self-signed-cert.ps1 or provide a real certificate thumbprint."
}

$signature = Set-AuthenticodeSignature `
  -FilePath $resolvedExe.Path `
  -Certificate $cert `
  -TimestampServer $TimestampServer

$signature | Format-List Status,StatusMessage,SignerCertificate,TimeStamperCertificate

if ($signature.Status -ne "Valid" -and $signature.Status -ne "UnknownError") {
  exit 1
}
