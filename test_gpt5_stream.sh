#!/bin/bash
curl -N -X POST http://localhost:8002/api/responses/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "input": [
      {"role": "user", "content": "你好"}
    ],
    "reasoning": {"effort": "medium"},
    "text": {"verbosity": "medium"}
  }'
