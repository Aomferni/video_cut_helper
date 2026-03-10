---
name: toadd-workflow
description: 管理 toAdd 功能测试工作区的新功能开发和代码迁移流程。当用户在 toAdd 目录开发新功能、需要将测试代码迁移到正式项目目录、或询问 toAdd 工作区使用方法时自动应用此技能。
---

# toAdd 工作区管理

## 概述

`toAdd` 是项目的**功能新增测试工作区**，用于隔离开发和测试新功能，避免影响主项目稳定性。

## 目录结构

```
toAdd/
├── planner/          # 活动策划功能测试区
├── remix_videos/     # 视频混剪功能测试区
├── static/           # 测试用静态资源
├── app.py            # 测试用后端入口
└── index.html        # 测试用前端页面
```

## 工作流程

### 阶段1: 开发（在 toAdd 中进行）

1. 在 `toAdd/` 下创建功能子目录（如 `toAdd/planner/`）
2. 开发独立的后端代码（`app.py`）和前端页面（`index.html`）
3. 使用 `toAdd/static/` 存放测试资源
4. 完成功能开发和初步测试

### 阶段2: 代码迁移（测试通过后）

将代码从 `toAdd/` 迁移到正式目录：

| 源文件 | 目标位置 | 操作 |
|--------|----------|------|
| `toAdd/*/app.py` | 根目录 `app.py` | 合并路由和函数 |
| `toAdd/*/index.html` | `templates/*.html` | 移动并重命名 |
| `toAdd/static/js/*.js` | `static/js/modules/*.js` | 移动模块文件 |
| `toAdd/static/css/*.css` | `static/css/style.css` | 合并样式 |

### 阶段3: 集成测试

1. 在正式环境中测试迁移后的功能
2. 验证与现有功能的兼容性
3. 检查路由、静态资源引用是否正确

### 阶段4: 清理

迁移验证通过后，删除 `toAdd/` 中的测试代码。

## 迁移检查清单

迁移前必须确认：

- [ ] 功能在 toAdd 中已完整测试通过
- [ ] 后端代码已合并到主 `app.py`，无重复路由
- [ ] HTML 模板已移动到 `templates/` 目录
- [ ] JavaScript 模块已移动到 `static/js/modules/`
- [ ] CSS 样式已合并到 `static/css/style.css`
- [ ] 所有文件路径引用已更新
- [ ] 集成测试通过

## 当前测试中的功能

- `planner/` - 活动策划功能
- `remix_videos/` - 视频混剪功能

## 注意事项

1. **不要直接在 toAdd 中修改主项目代码**
2. **迁移前备份重要文件**
3. **确保测试通过后再迁移**
4. **迁移后及时清理 toAdd 工作区**
