@echo off
chcp 65001 >nul
echo ========================================
echo   Cursor Cost Info - 构建 VSIX 扩展
echo ========================================
echo.

:: 检查 node 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查 npm 是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

:: 进入脚本所在目录
cd /d "%~dp0"

echo [1/4] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)

echo.
echo [2/4] 检查 vsce 工具...
call npm list -g @vscode/vsce >nul 2>nul
if %errorlevel% neq 0 (
    echo [信息] 全局安装 @vscode/vsce...
    call npm install -g @vscode/vsce
    if %errorlevel% neq 0 (
        echo [错误] 安装 @vscode/vsce 失败
        pause
        exit /b 1
    )
)

echo.
echo [3/4] 编译 TypeScript...
call npm run compile
if %errorlevel% neq 0 (
    echo [错误] 编译失败
    pause
    exit /b 1
)

echo.
echo [4/4] 打包 VSIX...
call vsce package
if %errorlevel% neq 0 (
    echo [错误] 打包失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建完成！
echo ========================================
for %%f in (*.vsix) do echo   生成文件: %%f
echo.
pause

