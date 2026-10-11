# 知行手记 · Personal Blog

一个独立的 Astro 中文技术博客：Markdown 写作、系列阅读、本地图片、全文搜索、RSS，以及面向多平台分发的离线导出。

本项目位于 `know-base/personal-blog/`，构建只读取本项目的内容目录，不会自动扫描或发布上一级知识库。正式站点为 `https://rancenlab.github.io/`，通过独立仓库的 GitHub Pages 工作流手动发布。

## 1. 立即查看

首次安装或换电脑：

```bash
cd personal-blog
npm ci
```

如果已经位于 `personal-blog`，不要重复执行 `cd personal-blog`。需要 Node.js 24，版本记录见 `.nvmrc`。

开发模式：

```bash
npm run dev
```

访问终端的 Local 地址，默认 `http://localhost:4321`。开发模式会显示草稿并附提示。首次开发模式没有 Pagefind 索引，完整搜索应在生产预览验证。

完整预览（与发布后的内容一致）：

```bash
npm run build
npm run preview
```

构建会校验文章、检查类型、生成页面与搜索索引，最后验证站内链接、图片、RSS、站点地图和草稿排除。端口被占用时以终端输出为准。前台服务按 Ctrl+C 停止；如果终端提示以后台方式运行，使用 `npm run dev:stop` 或 `npm run preview:stop` 停止对应服务。

## 2. 已实现功能

- 首页、个人主页、文章列表、系列列表及介绍页、标签聚合、RSS 订阅说明页、404 页。
- 首页为铺满屏幕的留白星图：系列星系与独立文章错落分布，点击星系展开文章、点击独立星光直接阅读；内容增多时分页探索，避免首页变成长列表。星图在开发模式下也不展示草稿。
- 明亮 / 深空主题：默认银白明亮主题，导航栏按钮可切换，全站同步并在浏览器中记住选择；禁用本地存储时仍可切换当前页面。
- 首页动态星空：文章星星沿轨道公转，星云、星轨与独立星光缓慢流动，偶尔出现流星；悬停或键盘聚焦星系时暂停文章位移，星星产生扩散光晕。支持系统「减少动态效果」，后台页面暂停动画。
- 全景航行：背景星海以不同景深持续流过整个画面，星云、行星和文章星系共享缓慢移动的视角；鼠标引导空间视差，阅读时前景停稳而背景继续流动。明暗主题、手机端和减少动态效果均适配。
- 独立文章星光与系列星系共用整张星图的位移，保持彼此的相对位置；位移范围随屏幕尺寸适配，阅读结束后平滑恢复整体漂移。
- 分层宇宙：首页每个系列只显示星系概览和最多三个装饰星点，独立文章仅预览最新两篇，其余可从全部文章或搜索进入。点击星系在弹层中展开文章，每组六篇，支持按标题和标签筛选、翻组、返回宇宙及进入完整系列目录。
- 星图支持拖动（含触屏）、滚轮或按钮缩放、复位；画布聚焦时可用方向键移动、加减号缩放、数字 0 复位。调整视角或展开星系时前景停稳，背景星海持续流动。
- 系列排序、系列上下篇、文章内标题目录。
- Markdown 表格与代码高亮，代码复制按钮。
- 文章同目录图片，构建输出静态资源。
- Pagefind 浏览器内全文搜索，不需要搜索服务器。
- RSS 摘要订阅、友好订阅说明页、站点地图、canonical 与基础分享元信息。
- 生产构建过滤草稿；开发模式展示草稿。
- 新建文章、新建系列、Markdown/HTML/图片导出命令。
- 元数据与系列关系校验、自动测试、构建产物检查。
- GitHub Pages 已配置，仅手动触发；本地编辑不会自动更新公网网站。

当前内容为“电力交易”专题：导读加七篇基础文章，整理自用户指定的 `笔记/电力市场/`。测试文章、示例系列及其附件已从当前内容中移除，原始笔记未修改；旧版本仍保留在 Git 历史中。整理范围与来源映射见 `CONTENT-MIGRATION.md`。

## 3. 项目结构

```text
src/config.ts                 站名、站点信息、个人资料
src/content/posts/            正文与同目录图片
src/content/series/           系列介绍
src/content.config.ts         Astro 内容集合
src/lib/content-schema.mjs    写作字段与关系规则
src/lib/content.ts            页面查询、过滤、网址工具
src/layouts/                  公共布局
src/components/               文章、系列卡片
src/pages/                    页面路由、订阅说明与 RSS
src/styles/global.css         全站样式
src/styles/future.css         深空主题与交互星图样式
src/styles/themes.css         明亮主题与主题切换按钮
src/styles/universe-home.css  首页全屏星空与散落布局
scripts/                      新建、导出、校验工具
templates/                    写作模板
tests/                        内容规则测试
public/                       公开静态文件
.github/workflows/deploy.yml   手动部署工作流
```

`node_modules/`、`dist/`、`.astro/` 和 `exports/` 都是生成内容，已加入 `.gitignore`。不要把私人附件放入 `public/`。

## 4. 新建独立文章

```bash
npm run new:post -- my-first-note "我的第一篇技术笔记"
```

生成：

```text
src/content/posts/my-first-note/
├── index.md
└── images/
```

编辑 `index.md`：

```yaml
---
title: "我的第一篇技术笔记"
slug: "my-first-note"
description: "一句话说明本文解决什么问题。"
publishedAt: 2026-10-09
tags: ["工程实践"]
draft: true
---
```

日期按真实发布日期填写。新增命令使用执行当天的 UTC 日期作为初始值；需要时手动调整。`draft` 默认 `true`，确认公开时改为 `false`。

`slug` 只能包含小写英文、数字和连字符。发布后保持稳定，修改标题不必修改网址。命令拒绝覆盖已有内容。

## 5. 新建系列并加入章节

```bash
npm run new:series -- industrial-communication "工业通信入门"
npm run new:post -- modbus-basics "Modbus 基础概念"
```

在系列文件中填写学习目标、适用读者与前置知识。在文章元数据中增加：

```yaml
series: "industrial-communication"
order: 10
```

后续章节使用 20、30 等顺序。`series` 与 `order` 必须同时出现；同一系列不能重复排序；系列必须存在。

系列状态：`ongoing` 连载中、`completed` 已完结、`paused` 暂停更新。章节目录自动生成，不要手工维护多份目录。没有已发布文章的系列不会出现在生产网站上。

## 6. 图片、链接和草稿

将图片放在文章的 `images/` 下：

```markdown
![架构说明](./images/architecture.png)
```

正文使用标准 Markdown，不使用 Obsidian `![[图片]]` 或 `[[笔记]]`。校验工具会提醒未转换的双链和缺失图片。文件名大小写必须与实际文件一致。

跨文章链接可使用相对网站路由，例如从一篇文章链接到另一篇：

```markdown
[另一篇文章](../another-post/)
```

这类相对链接在 GitHub 项目子路径下仍可工作。避免把本机绝对路径或 `index.md` 文件路径当作网页地址。构建产物检查会检测页面中的失效链接。

生产构建会排除草稿详情页、文章列表、系列目录、草稿专用标签、搜索与 RSS。`draft: true` 并不是私密存储机制：公开 Git 仓库中的原稿与历史仍可被看到。真正私人内容继续留在独立私有知识库。

发布日期不实现定时发布；是否公开仅由 `draft` 决定。

## 7. 搜索与检查

```bash
npm test
npm run validate
npm run build
```

`npm test` 检查默认草稿、错误日期、非法标识、系列引用与重复排序。

`npm run build` 检查所有内容并输出 `dist/`，随后生成 Pagefind 索引。搜索仅索引带 `data-pagefind-body` 的文章正文；正文目录、导航和页脚不作为文章内容索引。

用 `npm run preview` 打开 `/search/`，输入“电价”“虚拟电厂”“kWh”验证搜索，再输入带英文双引号的 `"UNPUBLISHEDCANARYXQZ"` 精确查询，确认旧内容不在结果中。

本机安装 Chrome 后可运行 `npm run test:browser`，在桌面与手机宽度测试真实页面、搜索、八篇章节导航、星系分页、图片和旧内容排除。独立星光的运动测试使用仅存在于测试浏览器中的夹具，不向正式内容添加测试文章。该命令需要已有 `dist/`，会自动启动并停止隔离的本地测试服务。截图输出到忽略的 `artifacts/`。其他环境可设置 `PLAYWRIGHT_CHANNEL`，浏览器安装按 Playwright 官方指引处理。

## 8. 导出到其他平台

```bash
npm run export:post -- power-grid-basics
```

产物：

```text
exports/power-grid-basics/
├── article.md
├── article.html
├── images/
└── manifest.json
```

导出会去掉 YAML 元数据、处理标准 Markdown 与引用式图片、复制本地图片、转换站内文章链接，并记录标题、原稿 hash、系列和图片清单。文章标题在 `manifest.json` 中，用于平台标题框。

该命令不会登录或向任何平台发送内容。上传图片、替换图片链接、检查排版、关联专栏和确认发布仍需后续操作。SVG 图片可能需要转成 PNG；原始 HTML 和站点专属组件不属于通用导出支持范围。

没有正式网址时，清单会提示链接指向本地。配置 `.env` 后重新导出再对外使用。导出默认拒绝草稿，确需本地预览可加 `--allow-draft`。

`manifest.json` 中 `sourceHash` 标识本次正文源文件，`sourceCommit` 仅在项目自身已经是独立 Git 仓库且存在提交时记录。工作区尚未提交的修改应以 hash 为准。其他平台的发布记录应另外维护，不要保存账号令牌。

## 9. 修改个人资料、站点名称与外观

- 修改 `src/config.ts` 中的 `profile` 对象，填写姓名、职业、简介、兴趣、邮箱、GitHub 和头像路径。
- 修改 `src/config.ts` 中的站名、作者、介绍和主题。
- 个人主页地址为 `/about/`，首页的“认识一下我”和导航中的“个人主页”都会指向这里。
- `/rss.xml` 保留为标准 RSS XML 地址；读者从导航或文章页点击订阅时进入 `/subscribe/`，页面会解释如何复制订阅地址。
- 修改 `src/styles/global.css` 的颜色变量与排版。
- 修改 `public/favicon.svg` 替换图标。

当前站名“知行手记”是可修改的初始名称。使用系统字体，无需从第三方字体服务加载。首页图形使用 CSS，不依赖远程图片。

## 10. GitHub Pages 发布

当前仓库为 `rancenlab/rancenlab.github.io`，已配置 `SITE_URL=https://rancenlab.github.io`、`BASE_PATH=/`。更新流程为：检查本地内容 → 提交并推送 → 在 Actions 手动运行 `Publish blog` → 验证正式站点。迁移文章本身不代表已提交或已上线。

新建或迁移站点时参考以下步骤：

1. 在本目录初始化独立 Git 仓库，不在上一级知识库初始化发布仓库。
2. 建立 `用户名.github.io` 或普通项目仓库，核对公开内容后提交。
3. GitHub 仓库设置中启用 `Pages → Source → GitHub Actions`。
4. 在 `Settings → Secrets and variables → Actions → Variables` 添加 `SITE_URL` 和 `BASE_PATH`。
5. 用户站点：`SITE_URL=https://用户名.github.io`，`BASE_PATH=/`。
6. 项目站点：`SITE_URL=https://用户名.github.io`，`BASE_PATH=/仓库名`。
7. 在 Actions 页面手动运行 `Publish blog`。
8. 实测页面、图片、中文搜索、RSS、HTTPS 后，再启用自动推送部署。

自动部署时，将工作流的触发条件改为：

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

工作流会拒绝缺少正式 HTTPS 网址的部署。本地预览的 canonical、RSS 和站点地图默认使用 `http://localhost:4321`，上线必须替换。

本地模拟正式配置：把 `.env.example` 复制为 `.env`，修改对应值后重新构建。用户站点与项目子路径分别测试，不在两个终端同时构建同一个 `dist/`。

## 11. 维护与边界

- 依赖安装使用 `npm ci` 和锁文件；不要每次启动升级包。
- 修改文章后运行构建，确认生成内容正常再发布。
- 已发布文章修改后，其他平台不会自动更新；根据发布记录逐个平台处理。
- 删除文章时同步检查正文链接、搜索索引、RSS、站点地图及相关测试；重新构建后再发布。
- 当前没有评论、账号系统、数据库、定时发布和在线管理后台。
- 当前没有自动转存平台图片、浏览器登录或真实平台发布验收。
- GitHub Pages 的读者访问速度需在上线后使用实际网络测试，域名本身不保证提速。

## 12. 参考

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)
- [Astro 图片](https://docs.astro.build/en/guides/images/)
- [Astro GitHub Pages 部署](https://docs.astro.build/en/guides/deploy/github/)
- [Pagefind](https://pagefind.app/docs/)

具体验收结果见 `VERIFICATION.md`。
