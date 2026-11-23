# SmartEdu THCS - Local Development Server with Multi-Port Fallback & Auto-Launch
$candidatePorts = @(8080, 8081, 8082, 8083, 3000, 5000, 8000, 8888)
$baseDir = $PSScriptRoot
$listener = $null
$port = $null

foreach ($p in $candidatePorts) {
    try {
        $test = New-Object System.Net.HttpListener
        $test.Prefixes.Add("http://localhost:$p/")
        $test.Start()
        $listener = $test
        $port = $p
        break
    } catch {
        if ($test -ne $null) {
            try { $test.Close() } catch {}
        }
    }
}

if ($null -eq $listener) {
    Write-Host "[LỖI] Không thể mở bất kỳ cổng nào trong danh sách: $($candidatePorts -join ', ')." -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra và đóng các ứng dụng hoặc server đang chiếm cổng rồi thử lại." -ForegroundColor Yellow
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SmartEdu THCS Local Server đang hoạt động tại:         " -ForegroundColor Green
Write-Host "  👉 URL: http://localhost:$port/                          " -ForegroundColor Cyan
Write-Host "  (Nhấn biểu tượng Thùng Rác 🗑️ hoặc đóng Terminal để tắt)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

# Tự động mở trình duyệt nếu chưa mở
try {
    Start-Process "http://localhost:$port/"
} catch {}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) { 
            $urlPath = "index.html" 
        }

        if ($urlPath -eq "api/key") {
            $keyJson = [System.Text.Encoding]::UTF8.GetBytes('{"key":""}')
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $keyJson.Length
            $response.AddHeader("Cache-Control", "no-cache")
            $response.OutputStream.Write($keyJson, 0, $keyJson.Length)
            $response.Close()
            continue
        }

        if ($urlPath.StartsWith("api/tts")) {
            $text = $request.QueryString["text"]
            $lang = $request.QueryString["lang"]
            if ([string]::IsNullOrWhiteSpace($lang)) { $lang = "vi" }
            if (![string]::IsNullOrWhiteSpace($text)) {
                $clean = $text.Substring(0, [System.Math]::Min(200, $text.Length))
                $googleUrl = "https://translate.google.com/translate_tts?ie=UTF-8&tl=$lang&client=tw-ob&q=" + [System.Uri]::EscapeDataString($clean)
                try {
                    $wc = New-Object System.Net.WebClient
                    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    $audioData = $wc.DownloadData($googleUrl)
                    $response.ContentType = "audio/mpeg"
                    $response.ContentLength64 = $audioData.Length
                    $response.AddHeader("Access-Control-Allow-Origin", "*")
                    $response.AddHeader("Cache-Control", "public, max-age=86400")
                    $response.OutputStream.Write($audioData, 0, $audioData.Length)
                } catch {
                    $response.StatusCode = 500
                }
            } else {
                $response.StatusCode = 400
            }
            $response.Close()
            continue
        }

        $filePath = Join-Path $baseDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".svg"  { "image/svg+xml" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".webp" { "image/webp" }
                    default { "application/octet-stream" }
                }
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.AddHeader("Cache-Control", "no-cache")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    }
} finally {
    if ($listener -ne $null) {
        try {
            if ($listener.IsListening) { $listener.Stop() }
            $listener.Close()
        } catch {}
    }
}
