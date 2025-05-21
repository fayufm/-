# 制作小记事便携版的PowerShell脚本

Write-Host "正在创建小记事便携版..." -ForegroundColor Cyan

# 清理旧文件
if (Test-Path -Path "小记事便携版") {
    Remove-Item -Path "小记事便携版" -Recurse -Force
}
if (Test-Path -Path "小记事便携版.zip") {
    Remove-Item -Path "小记事便携版.zip" -Force
}

# 第一步：构建便携版应用
Write-Host "正在构建应用..." -ForegroundColor Yellow
npm run build-portable

# 第二步：创建便携版目录结构
Write-Host "正在创建便携版目录结构..." -ForegroundColor Yellow
New-Item -Path "小记事便携版" -ItemType Directory -Force | Out-Null

# 第三步：复制文件
Write-Host "正在复制应用程序文件..." -ForegroundColor Yellow
Copy-Item -Path "dist\win-unpacked\*" -Destination "小记事便携版\小记事" -Recurse -Force

# 第四步：创建启动文件
Write-Host "正在创建启动文件..." -ForegroundColor Yellow
$startContent = @"
@echo off
echo 正在启动小记事...
set ELECTRON_NO_ATTACH_CONSOLE=true
cd "%~dp0小记事"
start "" "小记事.exe"
"@
Set-Content -Path "小记事便携版\启动小记事.bat" -Value $startContent -Encoding UTF8

# 第五步：创建说明文件
Write-Host "正在创建说明文件..." -ForegroundColor Yellow
$readmeContent = @"
小记事 - 便携版

【软件介绍】
小记事是一个简单的笔记软件，支持添加标题和内容，以及图片嵌入。

【使用方法】
1. 双击"启动小记事.bat"文件即可运行程序
2. 软件会在当前文件夹中保存您的所有笔记数据

【数据存储】
所有数据都存储在程序文件夹内，您可以随时复制整个文件夹进行备份

【特别说明】
如果您需要查看软件自动更新的内存档文件，可以在软件的"设置"-"文档管理"中
点击"内存档"按钮打开相关文件夹。

【注意事项】
1. 请不要删除任何程序文件
2. 请不要修改目录结构
3. 如需移动软件位置，请整体移动文件夹

感谢您使用小记事！
"@
Set-Content -Path "小记事便携版\使用说明.txt" -Value $readmeContent -Encoding UTF8

# 第六步：打包为zip
Write-Host "正在创建ZIP压缩包..." -ForegroundColor Yellow
Compress-Archive -Path "小记事便携版\*" -DestinationPath "小记事便携版.zip" -Force

# 完成
Write-Host ""
Write-Host "便携版制作完成!" -ForegroundColor Green
Write-Host "便携版文件夹: 小记事便携版" -ForegroundColor Green
Write-Host "便携版压缩包: 小记事便携版.zip" -ForegroundColor Green
Write-Host ""

Write-Host "按任意键继续..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 