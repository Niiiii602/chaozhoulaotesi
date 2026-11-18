# LAOTES 与 MayLendy 域名分离修正

已发布：2026-11-18 UTC。Cloudflare Worker仍为 `chaozhoulaotesi`，没有新建或移动域名绑定。

> 缓存修正已发布（2026-11-18 UTC）：`www.laotes.com` 现在直接返回200原站，不再做301；HTML与别名跳转改为302并带`Cache-Control: no-store`；`?refresh=laotes`额外返回`Clear-Site-Data: "cache"`，用于清掉浏览器里旧的永久跳转缓存。

| 域名 | 当前行为 |
| --- | --- |
| https://laotes.com/ | 200直接显示原LAOTESI官网 |
| https://www.laotes.com/ | 200直接显示原LAOTESI官网，不再跳转 |
| https://maylendy.com/ | 200显示MayLendy银白版 |
| https://www.maylendy.com/ | 301到https://maylendy.com/ |

## 实现

原先发布适配器和历史后端均包含laotes.com到maylendy.com的迁移规则。本次在`launch/release-worker.mjs`中增加LAOTES域名分支：普通GET/HEAD页面先读取原站专用资源，绕开迁移规则；API、邮件跟踪路径仍委托原后端。

`tools/build_laotes_site.py`从原项目现有的LAOTES文件构建独立资源目录`release/public/__laotes/`，包含七个公开页面、受保护统计界面及实际引用资源。目录页动态拼接的catalog-white产品图片也已完整纳入。共238个LAOTES文件。

公开地址仍是`laotes.com/products`等原有路径，内部资源目录不会暴露为可访问入口。LAOTES页面、robots、sitemap及结构化数据统一使用laotes.com。

MayLendy原有143个发布文件逐一校验未变，保留1秒数字增长、工厂三水印视频和所有当前页面。两个站点的同名样式、脚本、图片按域名隔离。

## 发布

- 新版本：`47860fcd-7844-4fe8-8756-e32bbf072337`
- 部署ID：`dac3856b-e550-4231-af90-4487c0343783`
- 前版本：`6f1aa31c-96e9-4b56-a260-55afbece774e`
- 全部原有秘密名称、非秘密变量及KV绑定在切换前核对一致。
- 现有域名、邮箱路由和KV数据未改动。

### 缓存修正发布

- 新版本：`ec5c4a4a-f352-478b-86f2-6f7b5fd923f6`
- 部署ID：`6a923952-2a7b-4dbc-96c6-2e0952d4ffca`
- 前版本：`47860fcd-7844-4fe8-8756-e32bbf072337`
- 上传时逐项比对15个绑定（秘密／变量／KV／ASSETS）与线上版本完全一致，未改动域名、邮箱路由或KV数据。
- 线上38项检查通过：两个品牌首页200且内容与构建包一致；`www.laotes.com`不再301；HTML与别名302带`no-store`；`?refresh=laotes`返回`Clear-Site-Data: "cache"`；MayLendy十个页面200；两站API健康／询盘405／统计401；私有目录与`__laotes`仍404；视频Range仍206。

## 检查

- 80项路由／API隔离／Range测试通过，Wrangler试编译通过。
- LAOTES七个公开页面及统计页、样式、脚本、产品图片、robots和sitemap均返回200，内容与恢复包匹配。
- MayLendy首页、目录、制造、联系、app.js、robots和sitemap内容继续匹配当前发布包。
- 仅HTML与别名路径做302规范化并带`no-store`，`?refresh=laotes`返回`Clear-Site-Data: "cache"`。
- 两个域名的API健康检查正常，询盘GET返回405，统计API未授权返回401。
- 浏览器实看LAOTES首页停留原域名且显示原品牌；目录／联系页×1440／390px检查无缺图或横向溢出。目录92张图片加载正常。
- 本次未发送真实询盘或测试历史邮件跟踪链接，不把API健康等同于实际邮箱收件验证。

报告：[线上分流检查](../review/domain-separation-live.json) · [版本切换记录](../review/domain-separation-deployment.json) · [缓存修正线上检查](../review/domain-cache-fix-live.json)。

## 后续发布注意

继续使用`tools/build_production.py`和`release/wrangler.json`构建／上传。项目根部`wrangler.toml`与历史`worker.js`仍是旧迁移配置，直接使用根配置部署会重新带回旧跳转规则；应以本次发布适配器为准。

若Chrome／Edge仍显示旧跳转，请直接打开https://www.laotes.com/?refresh=laotes：服务器会返回`Clear-Site-Data`清理该站点缓存；也可清除该站点缓存或使用无痕窗口。服务器当前已不返回跨品牌跳转。
