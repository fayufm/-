@echo off
REM 设置代码页为UTF-8
chcp 65001 > nul

echo 正在创建小记事便携版...

REM 清理旧文件
if exist "小记事便携版" rmdir /S /Q "小记事便携版"
if exist "小记事便携版.zip" del /F /Q "小记事便携版.zip"

REM 第一步：构建便携版应用
echo 正在构建应用...
call npm run build-portable

REM 第二步：创建便携版目录结构
echo 正在创建便携版目录结构...
mkdir "小记事便携版"

REM 第三步：复制文件
echo 正在复制应用程序文件...
xcopy /E /I /Y dist\win-unpacked "小记事便携版\小记事" > nul

REM 第四步：创建启动文件
echo 正在创建启动文件...
echo @echo off > "小记事便携版\启动小记事.bat"
echo echo 正在启动小记事... >> "小记事便携版\启动小记事.bat"
echo set ELECTRON_NO_ATTACH_CONSOLE=true >> "小记事便携版\启动小记事.bat"
echo cd "%%~dp0小记事" >> "小记事便携版\启动小记事.bat"
echo start "" "小记事.exe" >> "小记事便携版\启动小记事.bat"

REM 第五步：创建说明文件
echo 正在创建说明文件...
(
echo 小记事 - 便携版
echo.
echo 【软件介绍】
echo 小记事是一个简单的笔记软件，支持添加标题和内容，以及图片嵌入。
echo.
echo 【使用方法】
echo 1. 双击"启动小记事.bat"文件即可运行程序
echo 2. 软件会在当前文件夹中保存您的所有笔记数据
echo.
echo 【数据存储】
echo 所有数据都存储在程序文件夹内，您可以随时复制整个文件夹进行备份
echo.
echo 【特别说明】
echo 如果您需要查看软件自动更新的内存档文件，可以在软件的"设置"-"文档管理"中
echo 点击"内存档"按钮打开相关文件夹。
echo.
echo 【注意事项】
echo 1. 请不要删除任何程序文件
echo 2. 请不要修改目录结构
echo 3. 如需移动软件位置，请整体移动文件夹
echo.
echo 感谢您使用小记事！
) > "小记事便携版\使用说明.txt"

REM 第六步：打包为zip
echo 正在创建ZIP压缩包...
powershell -command "Compress-Archive -Path '小记事便携版\*' -DestinationPath '小记事便携版.zip' -Force"

REM 完成
echo.
echo 便携版制作完成!
echo 便携版文件夹: 小记事便携版
echo 便携版压缩包: 小记事便携版.zip
echo.
pause 