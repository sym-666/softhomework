require 'httparty'
require 'json'


latest_commit = `git log -1 --pretty=format:'%an%n%s'`.split("\n")

author = latest_commit[0]
commit_message = latest_commit[1]


webhook_url = ENV['FEISHU_WEBHOOK_URL']


headers = {
  'Content-Type' => 'application/json'
}

payload = {
  "msg_type": "text",
  "content": {
    "text": "CBaldur有新的提交！\n最新提交的作者: #{author}\n提交信息: #{commit_message}"
  }
}


response = HTTParty.post(webhook_url, body: payload.to_json, headers: headers)

if response.success?
  puts "成功发送提交信息到飞书"
else
  puts "发送提交信息到飞书失败: #{response.code} #{response.body}"
end