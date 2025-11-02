#!/bin/bash

# GPT-5 Responses API 服务启动脚本

echo "🚀 启动 GPT-5 Responses API 服务..."

# 检查 Python 虚拟环境
if [ ! -d "venv_gpt5" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv_gpt5
    source venv_gpt5/bin/activate
    
    echo "📥 安装依赖..."
    pip install fastapi uvicorn httpx python-dotenv pydantic
else
    source venv_gpt5/bin/activate
fi

# 检查环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  警告: OPENAI_API_KEY 未设置"
    echo "请在 .env 文件中配置 OPENAI_API_KEY"
fi

# 启动服务
echo "✨ 启动 GPT-5 服务 (端口 8002)..."
echo "⚠️  注意: 端口 8001 已被语音服务使用"
python gpt5_service.py

