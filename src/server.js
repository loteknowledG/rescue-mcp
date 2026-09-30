#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const root = path.resolve(process.env.RESCUE_ROOT || process.cwd());
const resolvePath = (p = ".") => {
  const full = path.resolve(root, p);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error("Path escapes RESCUE_ROOT");
  return full;
};
const text = (value) => ({ content: [{ type: "text", text: String(value) }] });
const run = (command, args = [], cwd = ".") => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: resolvePath(cwd), shell: false, windowsHide: true });
  let stdout = "", stderr = "";
  child.stdout.on("data", d => stdout += d);
  child.stderr.on("data", d => stderr += d);
  child.on("error", reject);
  child.on("close", code => resolve({ code, stdout, stderr }));
});

const server = new McpServer({ name: "rescue-mcp", version: "0.1.0" });

server.tool("fs_read", "Read a UTF-8 file under RESCUE_ROOT.", { path: z.string() }, async ({ path: p }) => text(await fs.readFile(resolvePath(p), "utf8")));
server.tool("fs_write", "Write a UTF-8 file under RESCUE_ROOT.", { path: z.string(), content: z.string() }, async ({ path: p, content }) => { await fs.mkdir(path.dirname(resolvePath(p)), { recursive: true }); await fs.writeFile(resolvePath(p), content, "utf8"); return text("ok"); });
server.tool("fs_patch", "Replace one exact string in a UTF-8 file.", { path: z.string(), oldText: z.string(), newText: z.string() }, async ({ path: p, oldText, newText }) => { const file = resolvePath(p); const source = await fs.readFile(file, "utf8"); const at = source.indexOf(oldText); if (at < 0) throw new Error("oldText not found"); if (source.indexOf(oldText, at + oldText.length) >= 0) throw new Error("oldText is not unique"); await fs.writeFile(file, source.slice(0, at) + newText + source.slice(at + oldText.length), "utf8"); return text("ok"); });
server.tool("fs_list", "List a directory under RESCUE_ROOT.", { path: z.string().default(".") }, async ({ path: p }) => text((await fs.readdir(resolvePath(p), { withFileTypes: true })).map(x => `${x.isDirectory() ? "DIR " : "FILE"} ${x.name}`).join("\n")));
server.tool("fs_search", "Search text files with git grep.", { query: z.string(), path: z.string().default(".") }, async ({ query, path: p }) => text(JSON.stringify(await run("git", ["grep", "-n", "--", query, p], "."), null, 2)));
server.tool("process_run", "Run a command inside RESCUE_ROOT.", { command: z.string(), args: z.array(z.string()).default([]), cwd: z.string().default(".") }, async ({ command, args, cwd }) => text(JSON.stringify(await run(command, args, cwd), null, 2)));
server.tool("git_status", "Run git status --short.", {}, async () => text(JSON.stringify(await run("git", ["status", "--short"], "."), null, 2)));
server.tool("git_diff", "Run git diff.", {}, async () => text(JSON.stringify(await run("git", ["diff"], "."), null, 2)));

await server.connect(new StdioServerTransport());
