# MayLendy 上线准备与密钥配置

当前状态：**已通过Cloudflare正式上线 https://maylendy.com/ ，源码与构建已推送到GitHub `main`。** 最新版本、线上验证与回退依据见 [DEPLOYMENT.md](DEPLOYMENT.md)。下文保留上线准备过程，旧凭据检查结论已被后续验证更新。

## 密钥检查结果

- GitHub：仓库 `Niiiii602/chaozhoulaotesi`，凭据已通过DPAPI保管，2026-11-18推送提交`f1e81ce`（仅`sandbox-maylendy-steel/`）。
- Cloudflare：账户级API令牌已校验并DPAPI保存；发布与回滚记录见[DEPLOYMENT.md](DEPLOYMENT.md)。
- 密钥没有打印、写入仓库或写入发布资源。

## 一键配置

双击 [Configure-DeployCredentials.cmd](Configure-DeployCredentials.cmd)，按提示输入两个令牌。输入内容以安全方式隐藏，不要发到聊天里。

1. GitHub：建议创建仅限 `Niiiii602/chaozhoulaotesi` 仓库的 fine-grained PAT，Repository permissions → **Contents: Read and write**。创建入口：https://github.com/settings/personal-access-tokens/new
2. Cloudflare：建议以 **Edit Cloudflare Workers** 模板创建 API Token，并确保 **Account Settings: Read**、**Workers Scripts: Edit**，资源限当前账户。此次版本上传不主动改域名／DNS；现有域名保持。创建入口：https://dash.cloudflare.com/profile/api-tokens
3. 窗口显示 `SUCCESS` 后回到聊天说“密钥已配置，继续上线”。此前上线授权仍有效，无需再次批准。

脚本会验证GitHub账户／仓库访问和Cloudflare令牌／现有Worker。验证后用Windows DPAPI加密保存到 `%APPDATA%\MayLendyDeploy\credentials.json`，只有当前Windows用户可解密；不生成明文 `.env`，不把令牌持久化进普通环境变量。后续部署进程会临时读取该加密存储。

## 已准备的生产版

运行 `python sandbox-maylendy-steel/tools/build_production.py` 可重新生成独立 `release/` 目录。`release/public/` 只包含公开文件：

- 23个公开页面，规范路径及内部链接按生产URL转换，移除公开页noindex。
- 105个被页面／样式／脚本实际引用的资源，共143个公开文件，约22.2 MB；含三水印MP4。
- 访问统计脚本与原有受保护的 `/analytics` 管理页面，后台继续noindex。
- 真实询盘适配器接入现有 `/api/quote`，保留附件限制、反营销过滤、防重复提交和失败保留内容。
- 审阅页面、内部资料、源数据、配置脚本、ZIP及无水印原片均不在 `public/` 中。

生产Worker是薄路由适配层，委托原`worker.js`处理邮件、统计、跟踪和API；原后端源码原样复制到`release/legacy-worker.mjs`。本地预览仍保持noindex和草稿表单，未被替换。

## 已实际完成的检查

- 新生产浏览器测试：23页×电脑／手机共46组布局、18项功能检查通过；所有询盘响应及统计请求均本地模拟，没有发送真实邮件。
- 原询盘／统计／表单后端测试：36项通过。
- 新旧域名、规范路由、私有路径隔离和API保留：60项测试通过。
- Wrangler 4.160.0 `versions upload --dry-run --keep-vars` 编译通过，没有上传或激活线上版本。

报告：`../review/production-browser-check.json`、`../release/build-report.json`。

## 凭据到位后的发布流程

1. 验证GitHub和Cloudflare实际权限，读取现有Worker绑定、秘密名称及当前活动版本，保存发布前快照。
2. 核对`WEBMAIL_KV`／`OUTREACH_KV`与现网一致，保留所有现有邮件／统计秘密和非秘密变量；出现额外绑定时先纳入生产配置。
3. 将本次明确选择的发布源代码与公开构建文件提交到GitHub，避免夹带本地无关修改、其他沙箱和凭据。
4. 使用`wrangler versions upload --keep-vars`上传新版本，再激活该版本；不通过普通全量deploy重建域名绑定。
5. 检查23个规范页面、核心图片／字体／JS、视频Range读取、旧域名重定向、私有路径404、robots／sitemap及API健康；真实询盘测试仅在明确需要时发送。
6. 验证成功后记录GitHub提交、Cloudflare版本ID及检查结果。出现实际故障时使用旧版本回退。

尚未验证：现网最新运行绑定和可用秘密、GitHub写入权限、Cloudflare上传及正式域名结果。这些步骤需要有效凭据。目前线上站点未因本轮操作而改变。
