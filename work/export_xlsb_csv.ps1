param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [string]$OutputDir = "work\extracted-csv",

  [string[]]$Sheets = @("sa1", "sa2", "sb1", "sb2", "sd1"),

  [int]$MaxColumns = 200
)

$ErrorActionPreference = "Stop"
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$outputPath = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$excel.AutomationSecurity = 3

try {
  $workbook = $excel.Workbooks.Open($sourcePath, 0, $true)
  foreach ($sheetName in $Sheets) {
    $sheet = $workbook.Worksheets.Item($sheetName)
    $csvPath = Join-Path $outputPath "$sheetName.csv"
    $used = $sheet.UsedRange
    $rowCount = $used.Rows.Count
    $colCount = [Math]::Min($used.Columns.Count, $MaxColumns)
    $writer = [System.IO.StreamWriter]::new($csvPath, $false, [System.Text.Encoding]::UTF8)
    try {
      $chunkSize = 5000
      for ($startRow = 1; $startRow -le $rowCount; $startRow += $chunkSize) {
        $endRow = [Math]::Min($startRow + $chunkSize - 1, $rowCount)
        $range = $sheet.Range($sheet.Cells.Item($startRow, 1), $sheet.Cells.Item($endRow, $colCount))
        $values = $range.Value2
        $chunkRows = $endRow - $startRow + 1
        for ($row = 1; $row -le $chunkRows; $row++) {
          $fields = New-Object string[] $colCount
          for ($col = 1; $col -le $colCount; $col++) {
            if ($chunkRows -eq 1 -and $colCount -eq 1) {
              $value = $values
            } else {
              $value = $values[$row, $col]
            }
            $text = if ($null -eq $value) { "" } else { [string]$value }
            $fields[$col - 1] = '"' + $text.Replace('"', '""') + '"'
          }
          $writer.WriteLine(($fields -join ","))
        }
      }
    }
    finally {
      $writer.Close()
    }
    Write-Host "Exportado: $csvPath ($rowCount linhas, $colCount colunas)"
  }
  $workbook.Close($false)
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
