# plane-attach-mcp

Local **stdio** MCP server that attaches local files to Plane work items via the
presigned-upload API — filling the gap left by the hosted Plane MCP, whose
attachment tool only accepts public URLs.

## Tools

- **check-connection** — verify the API token + workspace slug resolve.
- **attach-files** — upload one or more local files to a Plane work item.

## Setup

```bash
cd tools/plane-attach-mcp
npm install
cp .env.example .env      # then fill in PLANE_API_KEY
```

`package-lock.json` is intentionally not committed (it matches a global ignore
rule); `npm install` resolves against `package.json`.

## Register with Claude Code

The server reads its config from the environment — it does **not** auto-load
`.env` — so pass the variables through your MCP client's `env` block:

```bash
claude mcp add plane-attach \
  -e PLANE_API_KEY=your_token_here \
  -e PLANE_WORKSPACE_SLUG=beta-werkz \
  -- node "$(pwd)/server.mjs"
```

Then reconnect (`/mcp reconnect plane-attach`) and run **check-connection** to
confirm it's live.

## Environment

| Var | Required | Default | Purpose |
|-----|----------|---------|---------|
| `PLANE_API_KEY` | yes | — | Personal API token (secret) |
| `PLANE_WORKSPACE_SLUG` | yes | — | Workspace slug from the Plane URL |
| `PLANE_BASE_URL` | no | `https://api.plane.so` | API host (self-hosted override) |
| `PLANE_ATTACH_ROOT` | no | unrestricted | Confine attachable files to a directory tree |
| `PLANE_THROTTLE_MS` | no | `0` | Delay between uploads (ms) |

Requires Node ≥ 18.17.
