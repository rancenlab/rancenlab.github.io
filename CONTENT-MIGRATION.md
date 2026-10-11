# 电力交易专题整理

整理日期：2026-10-11。仅整理用户指定的 `笔记/电力市场/` 八份笔记，原文件不变；未迁入其他目录的工作资料、客户资料或私人笔记。

## 来源与章节

系列标识：`electricity-trading`；状态：连载中。八篇文章均已在本地设为公开内容，构建后将进入星系、文章列表、标签、搜索、RSS 与站点地图。是否已部署需另查 GitHub Actions，本文件不是部署记录。

| 顺序 | 原笔记 | 博客标识 |
| --- | --- | --- |
| 1 | 00-电力市场导读.md | electricity-market-guide |
| 2 | 01-电网基础知识.md | power-grid-basics |
| 3 | 02-电力市场的经济学基础.md | electricity-market-economics |
| 4 | 03-国内电改历程.md | china-electricity-reform |
| 5 | 04-电力市场化.md | electricity-marketization |
| 6 | 05-电力市场结构.md | electricity-market-structure |
| 7 | 06-电力市场主体.md | electricity-market-participants |
| 8 | 07-电价的组成.md | electricity-price-components |

## 整理方式

- 这是面向博客读者的重组精编，不是原稿逐字镜像：合并重复的历史、目录与总结，保留物理、经济、制度、结构、主体、价格的阅读主线。
- 《电网基础知识》的交易模式部分移入“电力市场化”。
- Obsidian 双链改为相对网页链接；不使用 `[TOC]` 占位符，由博客生成目录。
- 不引入 Mermaid 或数学渲染依赖；流程改成表格、文本和本地 SVG，公式改成可直接阅读的表达。
- 政策按年份和适用范围表述，正文附相关官方材料；不把历史费率、试点名单或旧基金项目作为现状发布。
- 修正直流远距离输电、功率与电量、期货与中长期、交易与调度、基本电费重复相加等易混淆点。算例明确标为假设。
- 政策入口是基础脉络核对，不是全量法规审查；具体交易须另查当地有效规则。

## 移除范围

移除建站测试系列 `build-a-learning-blog`、五篇测试文章 `start-with-markdown`、`organize-a-series`、`images-and-publishing`、`write-a-useful-note`、`draft-example`，以及测试图片和分发记录。删除后旧网址按 404 处理，不重定向到无关的新文章。

新构建清理旧页面并重新生成搜索索引。Git 历史中的旧示例不会被抹除；以前导出的本地文件也不会自动删除或成为发布内容。

## 验收入口

```bash
npm test
SITE_URL=https://rancenlab.github.io BASE_PATH=/ npm run build
npm run test:browser
```

浏览器测试覆盖八篇系列顺序、六篇加两篇的星系分页、筛选、搜索、文章图表、RSS、旧路由 404 和移动布局；测试夹具不进入正式文章目录。
