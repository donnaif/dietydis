# Turns a square PNG logo into the DietyDis app icon.
#   .\scripts\make-icon.ps1 -Source assets\logo-original.png
# Outputs (next to the source unless -OutDir is given):
#   icon.png      512x512 rounded app icon (transparent corners)
#   icon.ico      Windows icon with 16..256 px sizes
#   tray.png, trayUnread.png  64x64 tray icons (normal and with an unread dot)
#   splash.png    256x256 image for the loading screen
#   icon-preview.png  original vs app icon, large and small, on dark and light backgrounds
param(
    [Parameter(Mandatory)][string]$Source,
    [string]$OutDir,
    [double]$CornerRadius = 0.22,   # fraction of the icon size
    [double]$SmallZoom = 1.12       # extra zoom for sizes <= 48 px so details stay readable
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$Source = (Resolve-Path $Source).Path
if (-not $OutDir) { $OutDir = Split-Path $Source }
New-Item -ItemType Directory -Force $OutDir | Out-Null

$src = [System.Drawing.Image]::FromFile($Source)

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = 2 * $r
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function New-Graphics($bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.InterpolationMode = "HighQualityBicubic"
    $g.PixelOffsetMode = "HighQuality"
    $g.CompositingQuality = "HighQuality"
    return $g
}

# Rounded app icon at a given size
function New-IconBitmap([int]$size) {
    $zoom = if ($size -le 48) { $SmallZoom } else { 1.0 }
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = New-Graphics $bmp
    $g.Clear([System.Drawing.Color]::Transparent)
    $radius = [Math]::Max(1, $size * $CornerRadius)
    $path = New-RoundedPath 0 0 $size $size $radius
    $g.SetClip($path)
    # Crop the centre of the source when zooming
    $cw = $src.Width / $zoom; $ch = $src.Height / $zoom
    $srcRect = New-Object System.Drawing.RectangleF ((($src.Width - $cw) / 2), (($src.Height - $ch) / 2), $cw, $ch)
    $dstRect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose(); $path.Dispose()
    return $bmp
}

function Get-PngBytes($bmp) {
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    # -NoEnumerate: keep it one byte[] instead of PowerShell unrolling every byte
    Write-Output -NoEnumerate ([byte[]]$ms.ToArray())
}

# ---- icon.png (512) ----
$big = New-IconBitmap 512
$big.Save((Join-Path $OutDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# ---- icon.ico (PNG-compressed entries, supported since Windows Vista) ----
$sizes = 16, 20, 24, 32, 40, 48, 64, 128, 256
$images = [System.Collections.Generic.List[byte[]]]::new()
foreach ($s in $sizes) { $b = New-IconBitmap $s; $images.Add((Get-PngBytes $b)); $b.Dispose() }
$fs = [System.IO.File]::Create((Join-Path $OutDir "icon.ico"))
$w = New-Object System.IO.BinaryWriter $fs
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]; $len = $images[$i].Length
    $w.Write([byte]($(if ($s -ge 256) { 0 } else { $s })))  # width (0 = 256)
    $w.Write([byte]($(if ($s -ge 256) { 0 } else { $s })))  # height
    $w.Write([byte]0); $w.Write([byte]0)                     # palette, reserved
    $w.Write([uint16]1); $w.Write([uint16]32)                 # planes, bpp
    $w.Write([uint32]$len); $w.Write([uint32]$offset)
    $offset += $len
}
foreach ($img in $images) { $w.Write($img) }
$w.Close()

# ---- tray icons (64 px; Windows scales them down) and loading-screen image ----
$tray = New-IconBitmap 64
$tray.Save((Join-Path $OutDir "tray.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$unread = New-IconBitmap 64
$ug = New-Graphics $unread
$ug.FillEllipse([System.Drawing.Brushes]::White, 36, 36, 28, 28)          # white ring for contrast
$ug.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 242, 63, 67))), 39, 39, 22, 22)
$ug.Dispose()
$unread.Save((Join-Path $OutDir "trayUnread.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$splash = New-IconBitmap 256
$splash.Save((Join-Path $OutDir "splash.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$tray.Dispose(); $unread.Dispose(); $splash.Dispose()

# ---- preview sheet ----
$sheet = New-Object System.Drawing.Bitmap 1200, 760, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics $sheet
$g.Clear([System.Drawing.Color]::FromArgb(255, 32, 34, 37))
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 243, 243, 243))), 600, 0, 600, 760)
$font = New-Object System.Drawing.Font "Segoe UI", 15
$white = [System.Drawing.Brushes]::White; $black = [System.Drawing.Brushes]::Black
foreach ($side in @(@{ x = 0; brush = $white; label = "Dark taskbar" }, @{ x = 600; brush = $black; label = "Light taskbar" })) {
    $x = $side.x
    $g.DrawString("$($side.label)", $font, $side.brush, $x + 24, 16)
    $g.DrawString("Original", $font, $side.brush, $x + 40, 60)
    $g.DrawImage($src, $x + 40, 95, 240, 240)
    $g.DrawString("App icon (proposed)", $font, $side.brush, $x + 320, 60)
    $g.DrawImage($big, $x + 320, 95, 240, 240)
    $g.DrawString("Original at 48 / 32 / 24 / 16 px", $font, $side.brush, $x + 40, 370)
    $g.DrawString("App icon at 48 / 32 / 24 / 16 px", $font, $side.brush, $x + 40, 540)
    $px = $x + 40
    foreach ($s in 48, 32, 24, 16) {
        $small = New-Object System.Drawing.Bitmap $s, $s
        $sg = New-Graphics $small; $sg.DrawImage($src, 0, 0, $s, $s); $sg.Dispose()
        $g.InterpolationMode = "NearestNeighbor"
        $g.DrawImage($small, $px, 410, $s * 2, $s * 2)          # shown at 2x, pixel-exact
        $ib = New-IconBitmap $s
        $g.DrawImage($ib, $px, 580, $s * 2, $s * 2)
        $g.InterpolationMode = "HighQualityBicubic"
        $small.Dispose(); $ib.Dispose()
        $px += $s * 2 + 30
    }
}
$g.DrawString("Small sizes are shown enlarged 2x so you can see every pixel.", $font, $white, 24, 720)
$g.Dispose()
$sheet.Save((Join-Path $OutDir "icon-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$big.Dispose(); $sheet.Dispose(); $src.Dispose()
Write-Host "icon.png, icon.ico and icon-preview.png written to $OutDir"
