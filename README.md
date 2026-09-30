# rescue-mcp

Tiny standalone MCP emergency hatch for repairing a project when its normal tooling is down.

It has **no dependency on Echo Mirage or Robotech**.

## Tools

- `fs_read`
- `fs_write`
- `fs_patch`
- `fs_list`
- `fs_search`
- `process_run`
- `git_status`
- `git_diff`

Every filesystem path and command working directory is confined to `RESCUE_ROOT`.

## Run

```powershell
git clone https://github.com/loteknowledG/rescue-mcp.git D:\dev\rescue-mcp
cd D:\dev\rescue-mcp
npm install
$env:RESCUE_ROOT="D:\dev\echo-mirage"
npm start
```

Configure an MCP client to launch `node D:\dev\rescue-mcp\src\server.js` with `RESCUE_ROOT=D:\dev\echo-mirage`.

The server uses stdio, so it does not need Echo Mirage, a browser, or a listening network port.
