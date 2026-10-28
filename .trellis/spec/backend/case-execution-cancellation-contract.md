# Case Execution & Cancellation Contract

## Overview
When a calculation case is submitted (via JSON or Namelist), `CaseService` executes the remote supercomputer pipeline in background. This contract specifies active execution tracking, cooperative cancellation, remote cleanup, and real-time client notification.

## Architecture

1. **Active Execution Context (`CaseExecutionContext`)**:
   - `CaseService` maintains active running cases in `ConcurrentDictionary<Guid, CaseExecutionContext> _activeExecutions`.
   - The context holds `CancellationTokenSource Cts`, active `SshClient`, `SftpClient`, `ActiveSshCommand`, `Supercomputer`, and `RemoteWorkdir`.
   - `_activeExecutions` registers on task start and unregisters in `finally`.

2. **Pipeline Executor Cooperative Cancellation & Pipeline-Driven Cancel Step**:
   - `PipelineExecutor.Execute(...)` receives `CaseExecutionContext? executionContext`.
   - `ExecuteSshExec` utilizes `cmd.BeginExecute()` with `WaitHandle.WaitAny(handles)` to immediately intercept cancellation signals without synchronous blocking.
   - SFTP tail loops break immediately when cancellation is requested.
   - Remote cancellation logic is defined declaratively under `cancel` in `pipeline-schema.json` and `*-pipeline.yml` (e.g. `scancel` for Slurm on Beijing, `pkill` on Hubei) instead of hardcoding in code.
   - `PipelineExecutor.ExecuteCancel(SupercomputerDefinition sc, Guid userId, Guid caseId)` dynamically runs the supercomputer's configured `cancel` step via a dedicated SSH connection.

3. **Termination API (`POST /api/Case/TerminateCase`)**:
   - Authenticated endpoint requiring case ownership (or admin role).
   - Verifies case is in `running` status.
   - Signals CTS cancellation to immediately unblock `PipelineExecutor`.
   - Dispatches `_pipelineExecutor.ExecuteCancel(supercomputer, userId, caseId)` to run the pipeline's configured cancel step.
   - Updates DB status to `failed`, notifies `ICaseStatusNotifier` and `ICaseLogNotifier` with completion error.
