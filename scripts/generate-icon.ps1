$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $root "build"
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

function New-IconBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $margin = [Math]::Max(1, [int]($Size * 0.08))
  $radius = [Math]::Max(4, [int]($Size * 0.18))
  $rect = New-Object System.Drawing.Rectangle $margin, $margin, ($Size - 2 * $margin), ($Size - 2 * $margin)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc(($rect.Right - $diameter), $rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc(($rect.Right - $diameter), ($rect.Bottom - $diameter), $diameter, $diameter, 0, 90)
  $path.AddArc($rect.X, ($rect.Bottom - $diameter), $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 15, 118, 110)), ([System.Drawing.Color]::FromArgb(255, 14, 165, 148)), 35
  $graphics.FillPath($brush, $path)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), ([Math]::Max(1, $Size * 0.025))
  $graphics.DrawPath($pen, $path)

  $bolt = New-Object System.Drawing.Drawing2D.GraphicsPath
  $points = @(
    (New-Object System.Drawing.PointF ($Size * 0.60), ($Size * 0.20)),
    (New-Object System.Drawing.PointF ($Size * 0.36), ($Size * 0.54)),
    (New-Object System.Drawing.PointF ($Size * 0.52), ($Size * 0.54)),
    (New-Object System.Drawing.PointF ($Size * 0.42), ($Size * 0.80)),
    (New-Object System.Drawing.PointF ($Size * 0.70), ($Size * 0.45)),
    (New-Object System.Drawing.PointF ($Size * 0.54), ($Size * 0.45))
  )
  $bolt.AddPolygon($points)
  $boltBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
  $graphics.FillPath($boltBrush, $bolt)

  $fontSize = [Math]::Max(9, [float]($Size * 0.46))
  $font = New-Object System.Drawing.Font "Segoe UI", $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Near
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $textRect = New-Object System.Drawing.RectangleF ($Size * 0.18), ($Size * 0.14), ($Size * 0.58), ($Size * 0.68)
  $graphics.DrawString("Q", $font, $textBrush, $textRect, $format)

  $graphics.Dispose()
  $brush.Dispose()
  $pen.Dispose()
  $boltBrush.Dispose()
  $textBrush.Dispose()
  $font.Dispose()
  $format.Dispose()

  return $bitmap
}

function Get-PngBytes {
  param([System.Drawing.Bitmap]$Bitmap)

  $stream = New-Object System.IO.MemoryStream
  $Bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  return ,$stream.ToArray()
}

function Get-IcoDibBytes {
  param([System.Drawing.Bitmap]$Bitmap)

  $size = $Bitmap.Width
  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter $stream

  $writer.Write([UInt32]40)
  $writer.Write([Int32]$size)
  $writer.Write([Int32]($size * 2))
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]0)
  $writer.Write([UInt32]($size * $size * 4))
  $writer.Write([Int32]0)
  $writer.Write([Int32]0)
  $writer.Write([UInt32]0)
  $writer.Write([UInt32]0)

  for ($y = $size - 1; $y -ge 0; $y--) {
    for ($x = 0; $x -lt $size; $x++) {
      $color = $Bitmap.GetPixel($x, $y)
      $writer.Write([Byte]$color.B)
      $writer.Write([Byte]$color.G)
      $writer.Write([Byte]$color.R)
      $writer.Write([Byte]$color.A)
    }
  }

  $maskRowBytes = [int]([Math]::Ceiling($size / 32.0) * 4)
  $mask = New-Object byte[] ($maskRowBytes * $size)
  $writer.Write($mask)
  $writer.Dispose()

  return ,$stream.ToArray()
}

$png512 = New-IconBitmap -Size 512
$png512.Save((Join-Path $buildDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$png512.Dispose()

$sizes = @(16, 32, 48, 64, 128, 256)
$images = @()

foreach ($size in $sizes) {
  $bitmap = New-IconBitmap -Size $size
  $images += [PSCustomObject]@{
    Size = $size
    Bytes = [byte[]](Get-IcoDibBytes -Bitmap $bitmap)
  }
  $bitmap.Dispose()
}

$iconPath = Join-Path $buildDir "icon.ico"
$file = [System.IO.File]::Open($iconPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
$writer = New-Object System.IO.BinaryWriter $file

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$images.Count)

$offset = 6 + (16 * $images.Count)
foreach ($image in $images) {
  $widthByte = if ($image.Size -eq 256) { 0 } else { $image.Size }
  $writer.Write([Byte]$widthByte)
  $writer.Write([Byte]$widthByte)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$image.Bytes.Length)
  $writer.Write([UInt32]$offset)
  $offset += $image.Bytes.Length
}

foreach ($image in $images) {
  $writer.Write([byte[]]$image.Bytes)
}

$writer.Dispose()
$file.Dispose()

Write-Host "Generated build/icon.ico and build/icon.png"
