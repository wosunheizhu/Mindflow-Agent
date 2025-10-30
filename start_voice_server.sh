#!/bin/bash

# 语音服务启动脚本

cd "$(dirname "$0")"

echo "🚀 启动语音服务..."

# 创建虚拟环境（如果不存在）
if [ ! -d "venv_voice" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv_voice
fi

# 激活虚拟环境
echo "🔌 激活虚拟环境..."
source venv_voice/bin/activate

# 安装依赖
echo "📚 安装依赖..."
pip install -q -r voice_requirements.txt

# 启动服务
echo "🎤 启动语音服务器（端口8001）..."
python voice_server.py

