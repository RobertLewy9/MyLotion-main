$src = "D:\Codex_Project\MyLotion-main\resume\罗常青-前端开发实习生-简历.docx"
$out = "D:\Codex_Project\MyLotion-main\resume\_preview"
New-Item -ItemType Directory -Force -Path $out | Out-Null
Get-ChildItem $out -Filter *.png -ErrorAction SilentlyContinue | Remove-Item -Force
$pdf = Join-Path $out "resume.pdf"
Remove-Item $pdf -Force -ErrorAction SilentlyContinue
$word = New-Object -ComObject Word.Application
try { $word.Visible = $false } catch { }
try { $word.DisplayAlerts = 0 } catch { }
$doc = $word.Documents.Open($src)
$doc.ExportAsFixedFormat($pdf, 17)
$doc.Close(0)
$word.Quit()
Write-Host ("pdf exists: " + (Test-Path $pdf))
& "C:\Users\robert\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -c "import pymupdf; d=pymupdf.open(r'$pdf'); print('pages', d.page_count); [d[i].get_pixmap(dpi=150).save(r'$out' + chr(92) + 'page-%d.png'%(i+1)) for i in range(d.page_count)]"
