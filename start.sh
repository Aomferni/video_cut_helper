#!/bin/bash

# 视频剪辑工具启动脚本

echo "正在启动视频剪辑工具..."

# 检查是否安装了Python
if ! command -v python3 &> /dev/null
then
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查是否安装了FFmpeg
if ! command -v ffmpeg &> /dev/null
then
    echo "警告: 未找到FFmpeg，将尝试使用MoviePy内置的FFmpeg"
fi

# 检查是否存在requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "错误: 找不到 requirements.txt 文件"
    exit 1
fi

# 安装Python依赖（如果尚未安装）
echo "正在检查并安装Python依赖..."
if ! pip install -r requirements.txt; then
    echo "警告: 直接安装依赖失败，尝试使用--only-binary=all选项"
    if ! pip install --only-binary=all -r requirements.txt; then
        echo "错误: 安装依赖失败，请手动安装依赖包"
        echo "请参考README.md中的安装说明"
        exit 1
    fi
fi

# 启动Flask应用
echo "正在启动应用..."
echo "请在浏览器中访问: http://localhost:5001"
echo "注意：端口已更改为5001以避免与macOS AirPlay服务冲突"
python3 app.py