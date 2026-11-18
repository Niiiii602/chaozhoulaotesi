# MayLendy 银白版 · 上线准备（尚未执行）

当前是独立本地验收稿，23个公开页面保留 `noindex,follow`。本站没有提交收录、修改域名/Worker/WAF、改邮箱服务或发送询盘。

## 已准备

- `public-routes.json`：本地 HTML 与拟生产 URL 的映射；现有 `/`、`/products`、`/factory-tour`、`/quality-delivery`、`/about-us`、`/qa`、`/contact` 路径保留。新增产品族、盖型、两个 OEM 案例、采购指南入口及三篇指南。
- `sitemap.xml`：23个拟生产 canonical URL，不包括过滤参数、比较草稿、内部资料、构建文件或验收页面。
- `robots.txt.example`：仅供审批后的基础抓取配置参考，未应用。搜索用途与训练用途仍应分别审查，不仅凭伪装 User-Agent 放行请求。
- 可见内容与 JSON-LD 已改为 MayLendy、Chaozhou Chaoan Meiliandi Kitchenware Co., Ltd.、2014-05-05 注册日期和 nichole@maylendy.com。1985保留为制造历史。
- 规格、案例和采购指南均为生成好的静态 HTML。核心目录 52 个型号、67 条组件规格及 27 条问答在关闭 JavaScript 后可读；搜索/比较/Three.js 是浏览增强功能。
- 首页与制造页现有三水印工厂实拍视频：公开部署需包含 `assets/factory-workshop-maylendy.mp4` 和 `assets/factory-watermarked/factory-workshop-poster.jpg`。服务器应返回 `video/mp4`，支持 Range 请求和正常的视频缓存；不要把无水印原片当作公开播放文件。

## 正式发布时

1. 先确认设计与剩余规格问题；将可公开事实和模型适用范围定稿。内部测试草稿不能充当合格报告。
2. 核实新邮箱已可收信和对应服务端收件配置。网页显示新邮箱并不等于邮箱服务已经迁移；本次未测试收信、DNS或邮件投递。
3. 公开部署只包括获批HTML、site.css、countup.css、app.js、showcase.js、showcase.css、guides.css、fonts.css及实际引用的assets（首页另需本地Three.js、展示纹理脚本和许可证）。工厂照片必须使用 `assets/factory-watermarked/` 中的三水印版本。不要部署review.html、review/、data/、tools/、launch/、README、ZIP或用户导出资料。
4. 按URL映射把本地`.html`链接转为相应生产路径，核对既有Worker路由、重定向、旧锚点、API和跟踪链接。没有执行任何线上改动。
5. 为真实询盘接回服务端处理，恢复反滥用、附件限制、准确隐私告知与成功/失败反馈。本版表单只在本地校验、预填和导出。
6. 只对获批公开页面移除noindex，审核HTTP状态、canonical、sitemap、robots、普通链接、结构化数据和手机呈现。
7. 用公司站长账号和实际日志验证Google/Bing等索引与抓取，按官方文档分别检查OAI-SearchBot、PerplexityBot、Claude-SearchBot等。搜索可见性不要求无条件开放模型训练。
8. 上线后用固定采购问题记录实际品牌提及、来源链接、事实准确性与有效询盘。结构和内容优化不保证AI优先推荐或固定排名。

最新改动与验收见 `../review/ENGAGEMENT-UPDATE.md`；增长数字保留初始HTML的准确终值，固定产品规格不参与动画。此前98%／<0.5%继续标为交付与质量目标；实际数据口径见 `../review/DELIVERY-DATA-TEMPLATE.md`。线上抓取、HTTP状态及收录仍须在正式发布时验证。
