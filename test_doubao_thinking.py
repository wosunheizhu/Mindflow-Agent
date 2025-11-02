#!/usr/bin/env python3
"""
快速测试 Doubao API 的 thinking 功能
查看实际返回的 JSON 结构
"""

import os
import json
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv('.env.local')
load_dotenv()

async def test_doubao_thinking():
    """测试豆包 API 的 thinking 功能"""
    
    api_key = os.getenv("ARK_API_KEY")
    if not api_key:
        print("❌ 错误：未找到 ARK_API_KEY 环境变量")
        return
    
    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 测试1: thinking 禁用
    print("\n" + "="*60)
    print("🧪 测试1: thinking 禁用")
    print("="*60)
    
    payload_disabled = {
        "model": "doubao-seed-1-6-flash-250828",
        "messages": [
            {
                "role": "user",
                "content": "解释一下人工智能"
            }
        ],
        "thinking": {"type": "disabled"},
        "temperature": 0.8,
        "max_tokens": 100,
        "stream": True
    }
    
    print(f"\n📤 请求配置:")
    print(f"   model: {payload_disabled['model']}")
    print(f"   thinking: {payload_disabled['thinking']}")
    print(f"\n🔄 发送请求...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload_disabled) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ API错误 {response.status}: {error_text}")
                    return
                
                print(f"✅ 连接成功，开始接收流式响应...\n")
                
                chunk_count = 0
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            print("\n✅ 收到 [DONE]")
                            break
                        
                        try:
                            chunk = json.loads(data)
                            chunk_count += 1
                            
                            # 只打印前3个chunk的完整结构
                            if chunk_count <= 3:
                                print(f"\n📦 Chunk #{chunk_count}:")
                                print(json.dumps(chunk, indent=2, ensure_ascii=False))
                            
                            # 检查是否有 thinking 相关字段
                            choices = chunk.get('choices', [])
                            if choices:
                                choice = choices[0]
                                delta = choice.get('delta', {})
                                
                                if 'thinking' in delta:
                                    print(f"   ✅ delta.thinking: {delta['thinking'][:50]}...")
                                if 'thinking' in choice:
                                    print(f"   ✅ choice.thinking: {choice['thinking'][:50]}...")
                                
                                if 'content' in delta:
                                    print(f"   📝 delta.content: {delta['content']}")
                                    
                        except json.JSONDecodeError as e:
                            print(f"❌ JSON解析错误: {e}")
                
                print(f"\n📊 总共收到 {chunk_count} 个chunks")
    
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
    
    # 测试2: thinking 启用
    print("\n" + "="*60)
    print("🧪 测试2: thinking 启用 ⭐ 重点")
    print("="*60)
    
    payload_enabled = {
        "model": "doubao-seed-1-6-flash-250828",
        "messages": [
            {
                "role": "user",
                "content": "解释一下人工智能"
            }
        ],
        "thinking": {"type": "enabled"},  # 启用 thinking
        "temperature": 0.8,
        "max_tokens": 100,
        "stream": True
    }
    
    print(f"\n📤 请求配置:")
    print(f"   model: {payload_enabled['model']}")
    print(f"   thinking: {payload_enabled['thinking']} ⭐")
    print(f"\n🔄 发送请求...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload_enabled) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ API错误 {response.status}: {error_text}")
                    return
                
                print(f"✅ 连接成功，开始接收流式响应...\n")
                
                chunk_count = 0
                has_thinking = False
                thinking_location = None
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            print("\n✅ 收到 [DONE]")
                            break
                        
                        try:
                            chunk = json.loads(data)
                            chunk_count += 1
                            
                            # 打印所有chunk的完整结构（因为我们要找thinking）
                            if chunk_count <= 10:  # 只打印前10个
                                print(f"\n📦 Chunk #{chunk_count}:")
                                print(json.dumps(chunk, indent=2, ensure_ascii=False))
                            
                            # 检查是否有 thinking 相关字段
                            choices = chunk.get('choices', [])
                            if choices:
                                choice = choices[0]
                                delta = choice.get('delta', {})
                                
                                # 检查所有可能的位置
                                if 'thinking' in delta:
                                    has_thinking = True
                                    thinking_location = "delta.thinking"
                                    print(f"   ✅✅✅ 找到 delta.thinking: {delta['thinking'][:100]}...")
                                
                                if 'thinking' in choice:
                                    has_thinking = True
                                    thinking_location = "choice.thinking"
                                    print(f"   ✅✅✅ 找到 choice.thinking: {choice['thinking'][:100]}...")
                                
                                if 'reasoning' in delta:
                                    has_thinking = True
                                    thinking_location = "delta.reasoning"
                                    print(f"   ✅✅✅ 找到 delta.reasoning: {delta['reasoning'][:100]}...")
                                
                                if 'content' in delta:
                                    print(f"   📝 delta.content: {delta['content']}")
                                    
                        except json.JSONDecodeError as e:
                            print(f"❌ JSON解析错误: {e}")
                
                print(f"\n📊 总共收到 {chunk_count} 个chunks")
                
                if has_thinking:
                    print(f"\n🎉🎉🎉 成功找到 thinking 内容！")
                    print(f"📍 位置: {thinking_location}")
                else:
                    print(f"\n⚠️⚠️⚠️ 未找到任何 thinking 内容")
                    print(f"可能原因:")
                    print(f"  1. API 不支持 thinking 功能")
                    print(f"  2. 模型版本不支持")
                    print(f"  3. thinking 字段在其他位置（需要查看上面的 JSON 结构）")
    
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60)
    print("✅ 测试完成")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_doubao_thinking())

