# 上一轮规格、对齐与 Three.js 更新（历史记录）

> 本文记录上一轮单层六产品展示。当前已按《Maylendy官网修改参考.docx》升级为双层九产品展示；最新页面数、改动与验证以 [REFERENCE-UPDATE.md](REFERENCE-UPDATE.md) 及 `reference-*` 报告为准。本文的规格修正仍保留。
## 1. 子代理规格审计与修正

已按用户要求调用子代理只读审计全部 52 个核心储存型号、67 条规格组件，结合目录原文及本轮用户提供的明确规格截图。

套装名称保留 `01-BXH650/1300/2250ml`；其三个组件为：

| 组件 | 容量 | 含盖外尺寸 |
| --- | --- | --- |
| 1 | 650 ml / 22 oz / 2.7 cup | 17.5 × 13 × 5.8 cm |
| 2 | 1,300 ml / 44 oz / 5.5 cup | 21.5 × 16.1 × 7.1 cm |
| 3 | **2,500 ml / 85 oz / 10.6 cup** | **24.8 × 19.3 × 8.2 cm** |

已更新显示数据和全部五处规格副本，删除 capacityNote 与 To confirm 占位。独立型号 01RC2250 的 2,250 ml 不随套装改动。比较表、询盘草稿与结构化数据由同一份修正数据生成。

另按准确型号目录补回 01RC2000 的 8.4 cup 和 960 ml 分格型号的 4.6 cup，保留明确的目录参考标签；01RC2000 的 68 oz 仍采用此前用户确认。不同型号的印刷舍入值没有合并成通用换算值。

修正 01-KP650*2/2500ml 的嵌套旧尺寸为 29.8 × 21.4 × 7 cm；补充三层锅目录已有的内径×高度，未根据外形估算锅具容量。

审计结果：`spec-audit-current.json`（修正前问题清单）和 `spec-corrections.json`（已落实结果）。当前52个核心型号没有容量待确认占位。其他系列未提供的容量/尺寸继续说明实际资料边界，不把缺资料猜成数字。

## 2. 卡片和图片区对齐

- 型号网格同排等高，卡片内部使用弹性列布局，按钮与操作区贴底；规格不会因固定高度被裁掉。
- 分类卡统一 3:2 图片区，保鲜盒和锅具两张横图按同样方式铺满画面；餐盘/水壶同尺寸框中完整展示。
- 已在1440、1024、768、390、360宽度测量型号卡底边与操作区底边，误差均不超过1px；图片框比例均为3:2。

## 3. 首页 Three.js 多产品展示

- 固定使用本地 Three.js 0.160.1，库和许可证在 `assets/vendor/`。
- 六组真实产品照片作为透明纹理，放在有空间层次的平面上；产品真实外观未替换为虚构CAD模型。
- 自动从右向左连续滚动，两侧渐隐渐现；带轻微浮动、悬停倾转、鼠标控制的金属底座高光与阴影。
- 支持暂停/继续、前后按钮、方向键、触屏横向拖动，点击产品进入对应系列。
- 系统减少动态效果时停用自动运动，仍可手动切换；离屏或页面不可见时停止渲染。
- WebGL初始化失败或上下文丢失时回退为可横向浏览的普通产品链接；无JavaScript时也保留六组产品图片和链接。
- 展示纹理以本地data URI提供，避免双击HTML产生file协议跨域纹理问题；只有首页加载Three.js，不增加其他页面的WebGL负担。

## 4. 横版分类图

本轮仅生成一张横版衍生图，基于原有 `assets/factory-source/storage-collection.jpg` 扩展厨房与台面，目标3:2，保留主体产品，不增加文字或Logo。结果已目视检查，用于分类场景展示；规格卡、首页Three.js产品纹理仍为原有实际产品图。工厂图片没有使用生成内容。

最终文件：`assets/factory-source/storage-collection-landscape.jpg`，1536×1024。

使用的编辑提示：

> Edit the supplied real product lifestyle photograph into one wide 3:2 landscape composition by naturally extending the kitchen and countertop to both sides. Preserve the actual containers, body shapes, lids, clips, dark translucent lid colors, proportions and construction details. Keep the collection fully visible and centered, with realistic neutral lighting and brushed stainless reflections. No text, logo, watermark, border or invented product design.

## 5. 已执行的检查

- 原有17页 × 5种宽度，共85组回归通过：无页面横向溢出、缺图或脚本错误；原有搜索、比较、询盘、问答与手机菜单正常。
- 22项针对性检查通过：实际WebGL渲染、六产品向左移动、边缘渐隐、真实鼠标暂停/继续、前后按钮、键盘、触摸拖动、悬停反馈、离屏停止、reduced-motion、WebGL失败/上下文丢失回退、无JS链接、卡片等高、图片比例、套装规格比较与询盘同步。
- 结果在 `motion-check.json` 与 `browser-check.json`；截图在 `motion/` 和 `previews/`。

仅修改当前 `sandbox-maylendy-steel/`。原项目与其他沙箱保持不变，仍未发布，表单不发送邮件。
