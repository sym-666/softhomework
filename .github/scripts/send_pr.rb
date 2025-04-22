require 'httparty'
require 'json'

pr_title = ENV['PR_TITLE'] || ENV['GITHUB_HEAD_REF'] || ''
pr_user = ENV['PR_USER'] || ENV['GITHUB_ACTOR'] || ''
pr_url = ENV['PR_URL'] || ''

# 尝试从 github.event.json 获取更多 PR 信息
if File.exist?(ENV['GITHUB_EVENT_PATH'].to_s)
  event = JSON.parse(File.read(ENV['GITHUB_EVENT_PATH']))
  pr_title = event.dig('pull_request', 'title') || pr_title
  pr_user = event.dig('pull_request', 'user', 'login') || pr_user
  pr_url = event.dig('pull_request', 'html_url') || pr_url
end

webhook_url = ENV['FEISHU_WEBHOOK_URL']

headers = {
  'Content-Type' => 'application/json'
}

payload = {
  "msg_type": "text",
  "content": {
    "text": "CBaldur有新的PR！\nPR标题: #{pr_title}\n发起人: #{pr_user}\n链接: #{pr_url}"
  }
}

response = HTTParty.post(webhook_url, body: payload.to_json, headers: headers)

if response.success?
  puts "成功发送PR信息到飞书"
else
  puts "发送PR信息到飞书失败: #{response.code} #{response.body}"
end
