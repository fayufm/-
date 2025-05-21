@echo off
chcp 65001 > nul
echo 正在创建小记事便携版...

:: 创建临时文件夹
mkdir 小记事便携版 > nul 2>&1

:: 复制应用程序文件
echo 正在复制应用程序文件...
xcopy /E /I /Y dist\win-unpacked 小记事便携版\小记事 > nul

:: 复制使用说明文件
copy 便携版说明.txt 小记事便携版\ > nul

:: 创建启动文件
echo @echo off > 小记事便携版\启动小记事.bat
echo echo 正在启动小记事... >> 小记事便携版\启动小记事.bat
echo start "" "%%~dp0小记事\小记事.exe" >> 小记事便携版\启动小记事.bat

:: 打包为zip文件
echo 正在创建ZIP压缩包...
powershell -command "Compress-Archive -Path '小记事便携版\*' -DestinationPath '小记事-便携版.zip' -Force"

:: 清理临时文件
rmdir /S /Q 小记事便携版

echo 便携版已创建完成: 小记事-便携版.zip
pause 