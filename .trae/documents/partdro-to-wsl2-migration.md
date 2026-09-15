# Partdro 项目迁移到 WSL2 计划

## Context（背景）

当前 partdro 项目工作目录在 Windows：`C:\Users\81102\Desktop\partdro`。用户希望把整个 Trae-CN 工作环境切换到 WSL2 native 文件系统下的 `~/partdro`，让后续的 agent 工作（含 skills、MCP 服务器）都在 WSL2 中进行。这是"渐进式"迁移的起点——本次先完成"对话迁移"的全部范围（含 Trae UI 端聊天历史的尝试性迁移），并完成 skills 迁移；MCP 服务器迁移留到下次。

### 已查明的环境事实

- **WSL2 上 Trae-CN 已部署为 Remote-Server 模式**：进程 `trae_index_startup`、`server-main.js`、`ai-agent`、`ckg_server` 等已运行（启动于 2026-09-15 11:23）。Windows 端 Trae 客户端通过 Remote-WSL 协议连接，UI 仍在 Windows，但工作区数据/agent 状态/对话历史在 WSL2。
- **WSL2 已有的项目记忆目录**：`~/.trae-cn/memory/projects/` 下有 `-home-user1102-nanochat--p2-26adcbf8141ef94c4c4b`、`-home-user1102-nanogpt--p2-d03c8add4a50fccb8d91`、`-home-user1102-nanogpt-20260910--p2-81eebcf9bdc5945cc88a`。**没有 partdro 对应目录**。
- **路径 hash 算法无法预测**：用 SHA1/MD5 各种路径变体（`C:\Users\81102\Desktop\partdro`、`C:/Users/...`、`/c/Users/...` 等）都对不上 Windows 端的 hash `3d8984c715d6270000ed`。说明 Trae-CN 用自定义算法（可能 xxhash + salt / 路径 normalize 后再 hash）。**唯一可靠做法：让 Trae-CN 在 WSL2 中先打开一次 `~/partdro`，自动生成新项目目录，再覆盖内容**。
- **Windows 端 partdro memory**：28 个文件、114KB，分布在 12 个日期目录（20260902–20260915）+ `project_memory.md`。规模小。
- **user_profile.md**：Windows 端内容包含 3 节（Identity、Preferences、Recent Work Domains），WSL2 端仅 59 字节（基本空）。需要合并。
- **Trae 应用聊天历史存储位置**：
  - Windows 客户端 UI 层：`%APPDATA%\Trae CN\User\globalStorage\state.vscdb`（SQLite，476KB）+ `storage.json`（44KB）
  - WSL2 server 端：`~/.trae-cn-server/data/User/globalStorage/storage.json`（无 state.vscdb，因为 server 端不持久化 UI 状态）
  - **关键限制**：聊天历史按 workspace URI 索引；路径从 `file:///c%3A/Users/81102/Desktop/partdro` 变成 `file:///home/user1102/partdro` 之后，旧对话无法直接关联到新项目。**真正"重映射"需要直接编辑 SQLite 中 ItemTable 的 key 含路径的部分，复杂且风险高，作为"尝试性"步骤处理**。
- **Windows 端 mcp.json**（位于 `%APPDATA%\Trae CN\User\mcp.json`）：
  - `Playwright` — `npx -y @executeautomation/playwright-mcp-server`（跨平台，可复用）
  - `colab-mcp` — `C:\Users\81102\.local\bin\uvx.exe git+https://...`（Windows 路径，必须改成 WSL2 的 `uvx` 或 `~/.local/bin/uvx`）
  - `GitHub` — `npx -y @modelcontextprotocol/server-github` + GitHub PAT（可复用，注意 PAT 暴露风险）
- **partdro 项目内文档的 stale 引用**：
  - `AGENTS.md:110-113` 引用 `~/Desktop/partdro_final`（已不存在的旧仓库）
  - `AGENTS.md:158-161` 引用 `C:/Users/81102/.claude/skills/nano-banana/scripts/generate.py`（Windows 绝对路径，WSL2 下会失效）
  - `README.md:66-71` 提示端口 3001（CLAUDE.md 已声明该 README 过时，实际 5173）

### 关键不可行项

1. **无法预测 WSL2 项目目录 hash** → 必须先让 Trae-CN 自动生成目录，再覆盖内容。
2. **Trae UI 端聊天历史跨路径重映射无官方支持** → state.vscdb 拷贝过去后旧对话可能不显示在新项目下。本计划会尝试"导出→重写 workspace URI→导入"路径，不保证成功。

---

## 实施步骤

### 阶段 1：拷贝项目代码到 WSL2 native

**目标**：在 WSL2 中得到一份 partdro 副本，路径 `/home/user1102/partdro`，排除掉 `node_modules`、`dist`、`screenshots` 等可重生成的产物。

**命令**（在 Windows PowerShell 执行，调用 wsl）：
```bash
wsl -d Ubuntu-22.04 -- bash -lc '
  set -e
  SRC="/mnt/c/Users/81102/Desktop/partdro"
  DST="$HOME/partdro"
  mkdir -p "$DST"
  rsync -a --info=stats1 \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".vite" \
    --exclude="screenshots" \
    --exclude=".git/objects/pack" \
    "$SRC/" "$DST/"
  echo "---verify---"
  ls "$DST" | head -20
  du -sh "$DST"
'
```

**注意**：
- 不排除 `.git`（保留提交历史），但排除 pack 文件（可重新 gc 生成）
- 保留 `.trae/` 目录（含本计划文件）
- 保留 `AGENTS.md`、`CLAUDE.md`、`package.json`、`src/`、`public/`、`data/` 等

**验证**：
- `wsl ls ~/partdro/AGENTS.md` 应存在
- `wsl bash -c "cd ~/partdro && ls package.json src public 2>&1"` 应都能看到

---

### 阶段 2：项目 memory 迁移

**目标**：把 Windows 端 partdro 项目记忆（28 文件）拷到 WSL2 Trae-CN 对应的新项目目录。

**两步执行**：

**2a. 用户在 Windows Trae-CN 客户端打开 WSL2 路径**

让用户操作：在 Windows 的 Trae-CN 中，`File > Open Folder`，路径输入 `\\wsl.localhost\Ubuntu-22.04\home\user1102\partdro`（或通过 WSL Remote target 选 `~/partdro`）。Trae-CN 会：
- 连接到已运行的 WSL2 server
- 在 WSL2 的 `~/.trae-cn/memory/projects/` 下自动创建 `-home-user1102-partdro--p2-<新hash>/` 目录（空，可能只含 `.tmp`）
- 在 WSL2 的 `~/.trae-cn-server/data/User/workspaceStorage/` 下创建 32-hex workspace 目录

**用户操作完成后告诉我**，我用 PowerShell 命令探测新项目目录名：
```bash
wsl -d Ubuntu-22.04 -- bash -lc 'ls -la ~/.trae-cn/memory/projects/ | grep partdro'
```

**2b. 拷贝 memory 内容到新目录**

```bash
wsl -d Ubuntu-22.04 -- bash -lc '
  set -e
  SRC="/mnt/c/Users/81102/.trae-cn/memory/projects/-c-Users-81102-Desktop-partdro--p2-3d8984c715d6270000ed"
  DST=$(ls -d ~/.trae-cn/memory/projects/-home-user1102-partdro--p2-* 2>/dev/null | head -1)
  if [ -z "$DST" ]; then echo "ERROR: WSL2 project dir not yet created. Open ~/partdro in Trae-CN first."; exit 1; fi
  echo "Copying to: $DST"
  rsync -a --exclude=".tmp" "$SRC/" "$DST/"
  echo "---verify---"
  ls "$DST"
  find "$DST" -type f | wc -l
'
```

**2c. 合并 user_profile.md**

WSL2 端 `~/.trae-cn/memory/user_profile.md` 当前 59 字节基本为空。直接覆盖为 Windows 端内容（保留所有信息）：
```bash
wsl -d Ubuntu-22.04 -- bash -lc '
  cp /mnt/c/Users/81102/.trae-cn/memory/user_profile.md ~/.trae-cn/memory/user_profile.md
  cat ~/.trae-cn/memory/user_profile.md | head -20
'
```

**验证**：
- 新项目目录文件数 = 28 + 1（project_memory.md，已在 28 内，所以应 = 28）
- user_profile.md 行数 ≥ 10

---

### 阶段 3：尝试迁移 Trae UI 端聊天历史（高风险，尝试性）

**目标**：把 Windows 客户端 `state.vscdb` 中关于 partdro 的对话历史条目"重映射"到新的 workspace URI，让 WSL2 端 Trae-CN 能看到旧对话。

**前提认知**：
- WSL2 server 端 `~/.trae-cn-server/data/User/globalStorage/` 下当前**没有 state.vscdb**（已确认）。说明 server 端不持久化对话 UI 历史，对话历史只跟 Windows 客户端 UI 走。
- 因此"迁移聊天历史到 WSL2"等价于"让 Windows Trae 客户端在打开新路径时仍能列出旧路径下的对话"。
- VS Code 风格的 storage 通常用 workspace URI 作 key（如 `file:///c%3A/Users/81102/Desktop/partdro`）。改路径后，旧 key 失效。

**执行步骤**：

**3a. 备份 state.vscdb**
```powershell
Copy-Item "c:\Users\81102\AppData\Roaming\Trae CN\User\globalStorage\state.vscdb" "c:\Users\81102\AppData\Roaming\Trae CN\User\globalStorage\state.vscdb.pre-migration.bak"
```

**3b. 用 sqlite3 探测 schema**（如果 Windows 无 sqlite3，则跳过 3 整段，写入"未完成"备注）：
```powershell
sqlite3 "c:\Users\81102\AppData\Roaming\Trae CN\User\globalStorage\state.vscdb" ".tables"
sqlite3 "...\state.vscdb" ".schema ItemTable"
sqlite3 "...\state.vscdb" "SELECT key FROM ItemTable WHERE key LIKE '%partdro%' OR key LIKE '%chat%' OR key LIKE '%ai%' LIMIT 50;"
```

**3c. 如果发现 chat history 用 workspace URI 作 key**，则用 SQL `UPDATE` 把 key 中的 `file:///c%3A/Users/81102/Desktop/partdro` 替换为 `file:///home/user1102/partdro`（或新工作区的 URI）。

**3d. 如果 3c 不可行**（schema 不明 / key 不含路径 / 跨平台加密）→ **明确标注失败并跳过**，回滚到 3a 的备份。在最终总结里写明"Trae UI 端聊天历史无法跨路径迁移，建议人工查阅旧对话截图或手动新建对话引用旧上下文"。

**验证**：在 Windows Trae-CN 中打开 WSL2 路径下的 partdro，查看 Chat History 面板是否列出旧对话。

---

### 阶段 4：skills 迁移（渐进式第一步）

**目标**：把 Windows 端用户自定义 skills（不在 builtin_skills 下的）和被 AGENTS.md / CLAUDE.md 引用的外部 skill 脚本拷到 WSL2 对应位置。

**待迁移清单**：
- `c:\Users\81102\.claude\skills\nano-banana\` — 被 `AGENTS.md:158-161` 引用为图像生成 skill
- `c:\Users\81102\.claude\skills\bailian-image-video\` — 在 AGENTS.md 提到作为 fallback（确认存在性后再拷）
- `c:\Users\81102\.trae-cn\builtin_skills\TRAE-*` — 这些是 Trae-CN builtin，**WSL2 端 `~/.trae-cn/builtin_skills/` 已有同名目录**，跳过

**命令**：
```bash
wsl -d Ubuntu-22.04 -- bash -lc '
  set -e
  mkdir -p ~/.claude/skills
  for SKILL in nano-banana bailian-image-video; do
    SRC="/mnt/c/Users/81102/.claude/skills/$SKILL"
    DST="$HOME/.claude/skills/$SKILL"
    if [ -d "$SRC" ]; then
      rsync -a --exclude="__pycache__" --exclude="*.pyc" "$SRC/" "$DST/"
      echo "Migrated: $SKILL"
    else
      echo "Skip (not exist): $SKILL"
    fi
  done
  ls ~/.claude/skills/
'
```

**验证**：
- `wsl ls ~/.claude/skills/nano-banana/scripts/generate.py` 应存在
- 在 WSL2 Trae-CN 中打开新 partdro 后，`AGENTS.md` 中提到的 nano-banana skill 调用应能找到对应脚本

**注意**：nano-banana 脚本如果在 Linux 下跑需要对应的 Python 依赖（如 nano-banana 相关库），这一步可能需要 `pip install`；**留到用户首次调用该 skill 时按需安装**，本次只迁文件。

---

### 阶段 5：MCP 服务器迁移（不在本次范围，留到下次）

**已记录的迁移要点**（供下次执行参考）：
1. WSL2 端 `~/.trae-cn/mcps/` 已有 nanogpt 相关 MCP，需新建 `s_partdro-<hash>/` 子目录
2. 应用层 `mcp.json` 位置待定：WSL2 server 端可能在 `~/.trae-cn-server/data/User/mcp.json` 或继承 Windows 端
3. 三大 MCP 服务器迁移策略：
   - `Playwright` (npx) — 直接复用，但 WSL2 需要先 `npm i -g @executeautomation/playwright-mcp-server` 或依赖 npx 缓存
   - `GitHub` (npx + PAT) — 直接复用配置，PAT 不变
   - `colab-mcp` — 必须把 `C:\Users\81102\.local\bin\uvx.exe` 改成 `uvx`（`pip install uv` 后装到 `~/.local/bin/uvx`）
4. 验证：在 WSL2 Trae-CN 中打开 partdro，查看 MCP 工具列表

---

## 验证清单

- [ ] 阶段 1：`wsl ls ~/partdro/AGENTS.md` 存在；`wsl bash -c "cd ~/partdro && npm run build"` 能跑（验证依赖完整）
- [ ] 阶段 2：WSL2 端 `~/.trae-cn/memory/projects/-home-user1102-partdro--p2-*/` 下有 28 个文件，包括 `project_memory.md` + 12 个日期目录；`user_profile.md` 行数 ≥ 10
- [ ] 阶段 3（可能失败）：Windows Trae-CN 打开 WSL2 partdro 后能看到旧对话历史；若失败则回滚备份
- [ ] 阶段 4：`wsl ls ~/.claude/skills/nano-banana/scripts/generate.py` 存在
- [ ] 全局：在 Windows Trae-CN 客户端中通过 Remote-WSL 打开 `~/partdro`，agent 能正确加载 user_profile、project_memory、引用 skill 脚本

## 待用户操作的关键节点

1. **阶段 2a**：用户在 Windows Trae-CN 中"Open Folder" 选择 WSL2 路径下的 partdro，等 Trae-CN 自动创建项目目录后再继续 2b。我无法用脚本完成这一步。
2. **阶段 3 完成后**：用户在 Trae-CN UI 中查看对话历史面板，反馈是否能看到旧对话。
3. **MCP 迁移触发**：本次不做，下次用户说"开始迁 MCP"时启动阶段 5。
