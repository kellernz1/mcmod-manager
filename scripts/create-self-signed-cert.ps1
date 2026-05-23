param(
  [string]$Subject = "CN=MCMod Manager Code Signing"
)

$cert = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject $Subject `
  -FriendlyName "MCMod Manager Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyUsage DigitalSignature

Write-Host "Created self-signed code signing certificate:"
Write-Host "Thumbprint: $($cert.Thumbprint)"
Write-Host ""
Write-Host "Note: this is useful for local signing/testing, but it is not trusted by other PCs unless they trust this certificate."
