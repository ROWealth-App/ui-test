#!/usr/bin/env node
// plane-attach-mcp — local stdio MCP server that attaches local files to Plane
// work items. Bridges the gap left by the hosted Plane MCP, whose attachment
// tool only accepts public URLs.
//
// Env:
//   PLANE_API_KEY         (required) Personal API token from Plane settings
//   PLANE_WORKSPACE_SLUG  (required) Workspace slug as it appears in Plane URLs
//   PLANE_BASE_URL        (optional) Default: https://api.plane.so
//   PLANE_ATTACH_ROOT     (optional) If set, file paths outside this directory are refused

import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve, sep } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.PLANE_API_KEY;
const WORKSPACE = process.env.PLANE_WORKSPACE_SLUG;
const BASE_URL = (process.env.PLANE_BASE_URL || "https://api.plane.so").replace(/\/+$/, "");
const ATTACH_ROOT = process.env.PLANE_ATTACH_ROOT ? resolve(process.env.PLANE_ATTACH_ROOT) : null;

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".zip": "application/zip",
};

function mimeFor(path) {
  return MIME[extname(path).toLowerCase()] || "application/octet-stream";
}

function requireConfig() {
  const missing = [];
  if (!API_KEY) missing.push("PLANE_API_KEY");
  if (!WORKSPACE) missing.push("PLANE_WORKSPACE_SLUG");
  if (missing.length) throw new Error(`Missing required env: ${missing.join(", ")}`);
}

function checkRoot(absPath) {
  if (ATTACH_ROOT && absPath !== ATTACH_ROOT && !absPath.startsWith(ATTACH_ROOT + sep)) {
    throw new Error(`Path is outside PLANE_ATTACH_ROOT (${ATTACH_ROOT})`);
  }
}

const THROTTLE_MS = Number(process.env.PLANE_THROTTLE_MS || 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function planeFetch(path, init = {}) {
  for (let attempt = 0; ; attempt++) {
    if (THROTTLE_MS) await sleep(THROTTLE_MS);
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "X-API-Key": API_KEY,
        ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
    if (res.status === 429 && attempt < 5) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 15) * 1000);
      continue;
    }
    return res;
  }
}

async function attachOne(projectId, workItemId, filePath, namePrefix = "") {
  const absPath = resolve(filePath);
  checkRoot(absPath);
  const info = await stat(absPath);
  if (!info.isFile()) throw new Error("Not a regular file");
  const name = namePrefix + basename(absPath);
  const type = mimeFor(absPath);

  // Step 1: get presigned upload credentials
  const credRes = await planeFetch(
    `/api/v1/workspaces/${WORKSPACE}/projects/${projectId}/work-items/${workItemId}/attachments/`,
    { method: "POST", body: JSON.stringify({ name, type, size: info.size }) }
  );
  if (!credRes.ok) {
    throw new Error(`Credential request failed: HTTP ${credRes.status} ${await credRes.text()}`);
  }
  const cred = await credRes.json();
  const uploadData = cred.upload_data || cred.upload_credentials || cred;
  const uploadUrl = uploadData.url;
  const fields = uploadData.fields || {};
  const attachmentId =
    cred.asset_id || cred.attachment?.id || cred.id ||
    (typeof fields.key === "string" ? fields.key.split("/").pop() : null);
  if (!uploadUrl) throw new Error(`No upload URL in response: ${JSON.stringify(cred).slice(0, 500)}`);
  if (!attachmentId) throw new Error(`No attachment id in response: ${JSON.stringify(cred).slice(0, 500)}`);

  // Step 2: multipart POST to object storage — presigned fields first, file last
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const buf = await readFile(absPath);
  form.append("file", new Blob([buf], { type }), name);
  const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
  if (!uploadRes.ok && uploadRes.status !== 204) {
    throw new Error(`Storage upload failed: HTTP ${uploadRes.status} ${await uploadRes.text()}`);
  }

  // Step 3: mark the attachment as uploaded
  const doneRes = await planeFetch(
    `/api/v1/workspaces/${WORKSPACE}/projects/${projectId}/work-items/${workItemId}/attachments/${attachmentId}/`,
    { method: "PATCH", body: JSON.stringify({ is_uploaded: true }) }
  );
  if (!doneRes.ok && doneRes.status !== 204) {
    throw new Error(`Completion PATCH failed: HTTP ${doneRes.status} ${await doneRes.text()}`);
  }

  return { file: absPath, name, size: info.size, type, attachment_id: attachmentId, status: "uploaded" };
}

// CLI mode — same logic without MCP registration, usable before a client restart:
//   node server.mjs attach <project_id> <work_item_id> <file...>
//   node server.mjs check
const cliCmd = process.argv[2];
if (cliCmd === "attach" || cliCmd === "check") {
  requireConfig();
  if (cliCmd === "check") {
    const res = await planeFetch(`/api/v1/workspaces/${WORKSPACE}/projects/`);
    console.log(JSON.stringify({ ok: res.ok, http_status: res.status }, null, 2));
    process.exit(res.ok ? 0 : 1);
  }
  const rest = process.argv.slice(3);
  const prefixArg = rest.find((a) => a.startsWith("--prefix="));
  const namePrefix = prefixArg ? prefixArg.slice("--prefix=".length) : "";
  const [projectId, workItemId, ...files] = rest.filter((a) => !a.startsWith("--prefix="));
  if (!projectId || !workItemId || files.length === 0) {
    console.error("Usage: node server.mjs attach [--prefix=<name-prefix>] <project_id> <work_item_id> <file...>");
    process.exit(1);
  }
  const results = [];
  for (const fp of files) {
    try {
      results.push(await attachOne(projectId, workItemId, fp, namePrefix));
    } catch (err) {
      results.push({ file: fp, status: "failed", error: String(err.message || err) });
    }
  }
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(JSON.stringify({ uploaded: results.length - failed, failed, results }, null, 2));
  process.exit(failed ? 1 : 0);
}

const server = new McpServer({ name: "plane-attach", version: "1.0.0" });

server.registerTool(
  "attach-files",
  {
    title: "Attach local files to a Plane work item",
    description:
      "Upload one or more local files as attachments on a Plane work item (presigned-upload flow).",
    inputSchema: {
      project_id: z.string().describe("UUID of the Plane project"),
      work_item_id: z.string().describe("UUID of the work item (issue) to attach to"),
      file_paths: z.array(z.string()).min(1).describe("Absolute paths of local files to attach"),
      name_prefix: z
        .string()
        .optional()
        .describe("Optional prefix for the uploaded attachment names (e.g. 'mobile-') to avoid filename collisions"),
    },
  },
  async ({ project_id, work_item_id, file_paths, name_prefix }) => {
    requireConfig();
    const results = [];
    for (const fp of file_paths) {
      try {
        results.push(await attachOne(project_id, work_item_id, fp, name_prefix || ""));
      } catch (err) {
        results.push({ file: fp, status: "failed", error: String(err.message || err) });
      }
    }
    const failed = results.filter((r) => r.status === "failed").length;
    return {
      isError: failed === results.length,
      content: [
        {
          type: "text",
          text: JSON.stringify({ uploaded: results.length - failed, failed, results }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "check-connection",
  {
    title: "Check Plane API connectivity",
    description:
      "Verify the configured API key and workspace slug by listing projects. Read-only.",
    inputSchema: {},
  },
  async () => {
    requireConfig();
    const res = await planeFetch(`/api/v1/workspaces/${WORKSPACE}/projects/`);
    const body = await res.text();
    let summary;
    if (res.ok) {
      try {
        const j = JSON.parse(body);
        const projects = (j.results || j).map?.((p) => ({ id: p.id, name: p.name })) || [];
        summary = { ok: true, workspace: WORKSPACE, projects };
      } catch {
        summary = { ok: true, workspace: WORKSPACE, raw: body.slice(0, 300) };
      }
    } else {
      summary = { ok: false, http_status: res.status, body: body.slice(0, 300) };
    }
    return { isError: !res.ok, content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
