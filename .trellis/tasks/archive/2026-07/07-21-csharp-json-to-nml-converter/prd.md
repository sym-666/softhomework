# 用 C# 实现 JSON→namelist 转换器并弃用 cbaldur-json-to-nml

## Goal

用纯 C# 实现 JSON + comment → Fortran namelist（`jobxdat`）转换，接入 `PipelineExecutor`，从运行路径断开外部二进制 `Others/cbaldur-json-to-nml`。

## Background

- 现网转换一直由 Rust 二进制 `Others/cbaldur-json-to-nml` 完成（`CaseService` 旧路径与 `PipelineExecutor.ExecuteConvert` 均是进程调用）；仓库内**无**可复用的旧 C# 转换实现。
- 黄金对照：`cbaldur-backend/data/1/163/{input.json,comment,jobxdat}`；重跑旧二进制与现有 `jobxdat` 字节一致。
- `data/1/35/input.json` 为空，不再作为主 fixture。
- 从 163 归纳的语义规则：头行 `F  0  0  0` + 4 行 comment；JSON 顶层 group 按顺序输出；`nmreadN` → `&nmread`；group 内 key 字典序；`  key = value`（2 空格缩进）；bool → `.true.`/`.false.`；数组逗号分隔无空格；超长行用 `     ,`（5 空格+逗号）续行；group 以 `/` 结束。

## Requirements

1. 新增纯托管 C# 转换器：输入 JSON + comment，输出 namelist 文本/文件。
2. `PipelineExecutor` 的 `convert` 步骤改为调用该转换器，**不再** `RunBinary` 外部转换进程。
3. 更新 `baldur-pipeline.yml`、pipeline schema、`ConvertConfig`：去掉对 `binary`/`args` 的运行时依赖（字段可删或忽略）。
4. 单测以 `data/1/163` 为主：经 `NormalizeNamelist` 后与期望 `jobxdat` 语义一致；并断言输出**每一行整行（含缩进）≤ 80 字符**。
5. **保留** `Others/cbaldur-json-to-nml` 文件于仓库；仅从运行路径断开。完成后优先跑单元测试验证。

## Acceptance Criteria

- [ ] JSON 提交的 convert 步骤不再启动 `cbaldur-json-to-nml`。
- [ ] `data/1/163`：`NormalizeNamelist(actual) == NormalizeNamelist(expected)`。
- [ ] 转换输出任意一行长度 ≤ 80；有单测覆盖。
- [ ] `dotnet test`（至少转换相关测试）通过，且不依赖该二进制存在。
- [ ] pipeline YAML/schema 与实现一致，无仍被执行的 binary 配置。
- [ ] `Others/cbaldur-json-to-nml` 文件仍存在于仓库。

## Out of Scope

- 与旧二进制换行位置的字节级一致（旧约 100 列；本实现 80 列）。
- 前端逐步输入 schema / 默认值。
- 彻底删除 `ExecuteCode` API / 前端入口（当前仅后端停用沙箱实现）。

## Follow-on (done)

- `ExecutePythonCode` 绘图沙箱实现已注释，调用时抛出 `NotSupportedException`。
- 已删除 `Others/` 非 key 文件：`cbaldur-json-to-nml`、`fsubmit`、`wazero`、`config.json`；保留 `*.key`。
- Dockerfile 去掉 wazero COPY；docker-compose 去掉 sandbox 服务与 config.json 挂载；根目录 `config.json` 与 `WasmRuntime` 配置已移除。

## Decisions

| 议题 | 决定 |
|------|------|
| 等价标准 | `NormalizeNamelist` 后语义一致（非字节级） |
| 行宽 | 整行（含缩进）≤ 80；仅对赋值/续行做折行 |
| 转换器 / 沙箱二进制 | 已从磁盘删除；运行路径已断开 |
| 绘图沙箱 | 注释实现并拒绝执行；API 保留 |
| 验证顺序 | 实现后先跑单元测试 |
