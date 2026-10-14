# 打包 FC 代码：zip 条目统一用正斜杠（FC 是 Linux，反斜杠会破坏目录结构）
# .NET Framework 自带 ZipFile.CreateFromDirectory 在 Windows 会写反斜杠，故逐个 CreateEntry
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][string]$Dst
)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $Dst) { Remove-Item $Dst -Force }
$Src = (Resolve-Path $Src).Path.TrimEnd('\')

$zip = [System.IO.Compression.ZipFile]::Open($Dst, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $Src -Recurse -File
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($Src.Length + 1) -replace '\\', '/'
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $f.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
  }
  Write-Output ("ZIP_FILES=" + $files.Count)
} finally {
  $zip.Dispose()
}
