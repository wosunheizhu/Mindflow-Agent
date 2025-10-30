# Railway Dockerfile - Python语音服务后端
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制Python后端文件
COPY voice_server.py .
COPY doubao_tts_client.py .
COPY xfyun_asr_client.py .
COPY llm_tts_stream.py .
COPY llm_client.py .

# 暴露端口（Railway会自动映射）
EXPOSE 8001

# 启动命令
CMD ["python", "voice_server.py"]

