
curl --location "https://ark.cn-beijing.volces.com/api/v3/chat/completions" \
--header "Authorization: Bearer $ARK_API_KEY" \
--header "Content-Type: application/json" \
--data '{
 "model": "doubao-seed-1-6-250615",
     "messages": [
         {
             "role": "user",
             "content": [
                 {
                     "type":"text",
                     "text":"我要研究深度思考模型与非深度思考模型区别的课题，体现出我的专业性"
                 }
             ]
         }
     ],
     "thinking":{
         "type":"disabled"
     }
}'
