# MayLendy 正式上线记录

## 当前生产状态

- 生产站：**https://maylendy.com/**
- Cloudflare Worker：`chaozhoulaotesi`（沿用现有服务）
- 正式版本：`ec5c4a4a-f352-478b-86f2-6f7b5fd923f6`
- 部署ID：`6a923952-2a7b-4dbc-96c6-2e0952d4ffca`
- 流量：100%新版本；laotes.com与www.laotes.com均直接200显示原LAOTES官网，maylendy.com显示MayLendy银白版，保留1秒数字增长。
- 最新更新日期：2026-11-18 UTC；前版本`47860fcd-7844-4fe8-8756-e32bbf072337`（更早`6f1aa31c-96e9-4b56-a260-55afbece774e`、`3a871255-b69c-49d4-b422-e62988115caa`、`624fcefc-ed11-4f95-b1e8-933959a83f0e`、原版`97c86f1c-ef60-447b-a8c5-371180140595`）保留。域名分流依据见 [DOMAIN-SEPARATION.md](DOMAIN-SEPARATION.md)。
- GitHub：**已同步**，提交`f1e81ce`推送至`main`（仅`sandbox-maylendy-steel/`，911个文件，约121 MB；本地ZIP包与工具缓存已用`.gitignore`排除）；根目录原LAOTES文件未改动。

## 发布内容与保留项

生产目录为`release/public/`：MayLendy的23个公开页面及143个原发布文件保持一致；另外增加238个按域名隔离的LAOTES文件。公开页采用各自品牌canonical；后台统计页继续noindex。

原生产后端代码已从Cloudflare备份，并原样保留在 `release/legacy-worker.mjs`；薄路由适配器负责规范URL、私有路径隔离和MP4单区间Range。邮件、统计、跟踪API沿用原后端。后端SHA-256：`d83971d5df4ec443545a116eb8a1ec70f846b0d4a243db45453f6dacc3a0440b`。

所有原有秘密名称、两组KV绑定及非秘密变量值均已逐项核对保留。没有重建域名、改邮件收发地址或清空KV。`maylendy.com`、`www.maylendy.com`、`laotes.com`、`www.laotes.com`四个绑定保持。

Cloudflare令牌使用Windows DPAPI加密保存到当前用户配置目录，没有进入项目、公开资源或日志。附件中的R2 S3凭据没有被使用，本次不需要R2。

## 已完成验证

- 23个规范页面均200，canonical及index,follow正确。
- 全部143个公开文件均可读取且内容匹配；非HTML采用SHA-256逐字节验证。HTML移除Cloudflare现有官方Insights注入脚本并统一换行后，与本地发布HTML完全一致。
- 三水印视频完整读取哈希匹配，`Range: bytes=0-1023`返回206和1024字节。浏览器实际播放及跳转至16秒通过。
- www和HTML别名在各自品牌域名内规范跳转；laotes.com不再重定向到maylendy.com。最新核验见[域名分离修正](DOMAIN-SEPARATION.md)。
- review、data、launch及ZIP等私有路径404。
- `/api/health`正常，Zoho通道及原跟踪KV绑定正常；`/api/analytics`未授权返回401，GET `/api/quote`返回405。
- 首页、目录、制造页、联系页×电脑／手机，共8组线上布局，无缺图、JS错误和横向溢出。
- 缓存修正上线后38项线上检查通过（82项路由测试本地通过）：www.laotes.com直接200显示原站、HTML／别名302带no-store、`?refresh=laotes`返回`Clear-Site-Data: "cache"`、MayLendy十个页面200、双站API与私有路径行为不变。记录见[缓存修正线上检查](../review/domain-cache-fix-live.json)与[部署记录](../review/domain-cache-fix-deployment.json)。
- 发布前本地生产版46组布局、18项功能检查；原后端36项和生产路由／Range67项测试通过。

本次没有发送真实测试询盘，不能把API健康等同于已独立验证邮箱收件。没有修改搜索引擎站长账户或保证收录／排名。

线上记录：[文件与接口](../review/production-live-check.json) · [浏览器](../review/production-live-browser-check.json)。截图在 `review/live-previews/`。

## 回退

原站版本：`97c86f1c-ef60-447b-a8c5-371180140595`。需要回退时，将现有Worker流量100%切回该版本，不要删除KV、秘密或域名绑定。首次银白版版本`624fcefc-ed11-4f95-b1e8-933959a83f0e`也已保留；最终版本另补充了MP4 Range支持。

发布前代码、配置及部署快照保存在本次会话临时目录的 `production-snapshot/`，包含未公开配置，不应上传到公共仓库。正式版本ID及回退ID已记录在本文件，长期有效性取决于Cloudflare版本保留策略。

## GitHub同步

已用仓库范围内有效的GitHub凭据完成提交与推送：提交`f1e81ce`（父提交`4a3fb09`），只包含本次站点沙箱的源码、构建产物、工具与发布记录。推送凭据仅以进程内请求头使用，未写入`remote`地址、`.git/config`或任何文件；令牌以DPAPI保存在`%APPDATA%\MayLendyDeploy\credentials.json`。

如需再次推送，双击 [Configure-GitHub.cmd](Configure-GitHub.cmd) 更新令牌即可。

本次Cloudflare账户令牌权限范围很广，且曾作为附件提供。建议发布验收后在Cloudflare创建最小权限的替代令牌，验证后撤销旧令牌；不要将令牌再发送到聊天、仓库或公开附件。
