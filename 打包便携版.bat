@echo off
echo 正在打包小记事便携版...

:: 创建临时文件夹
mkdir tmp_portable >nul 2>&1

:: 复制需要的文件到临时文件夹
xcopy /E /I /Y dist\win-unpacked tmp_portable\app >nul
copy 启动小记事.bat tmp_portable\ >nul
copy 便携版说明.txt tmp_portable\ >nul

:: 创建一个简单的启动文件在临时文件夹中
echo @echo off > tmp_portable\启动.bat
echo start "" "%%~dp0app\小记事.exe" >> tmp_portable\启动.bat

:: 打包临时文件夹为ZIP
powershell -command "Compress-Archive -Path 'tmp_portable\*' -DestinationPath '小记事-便携版.zip' -Force"

:: 删除临时文件夹
rmdir /S /Q tmp_portable

echo 打包完成：小记事-便携版.zip
pause 