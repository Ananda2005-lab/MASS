# PENDING LIST — jo baad mein karna hai (user-approved order)

1. **First-run smoke script** — user machine pe keys lagne ke baad ek-shot verification
   (keys → streaming → refine → vision → tools → browser). (User-approved plan item.)
2. **Personal-doc RAG (Sources URL/PDF/text)** — planned feature, abhi honestly empty state.
3. **Final commit** — poora project khatam hone ke baad EK commit (user-approved rule). Uske baad
   user machine pe `git pull`, phir `pip install -r requirements.txt` + `playwright install chromium`.

## Done (reference)
- Quality layer 9/9 + eval harness 18/18
- 22-key handling (rotation/failover/quota) + per-key base URL + xkiro/b.ai providers
- Web search + web fetch (live, keyless)
- Browser full automation (click/type/extract/screenshot)
- Real MCP client + default filesystem server (Codex/Claude jaisa) + user-add
- Opt-in full system control (AAP_SANDBOX_SCOPE=full)
- Project-folder capability: files.list/read + terminal (grep/build/test) + MCP filesystem root
- Vision / image support — backend + UI 📎 upload, multimodal proven (×3 sub-agents)
- Folder attach (path + browser picker upload) + GET /project/tree + sidebar Files LIVE project tree
- TopBar wired (providers/tools/MCP/status) + Auto/Ask single-round-trip latency fix
- Self-refine pass (draft → self-critique → improved final; AAP_SELF_REFINE=0 to disable)
- Token-level streaming (SSE → EventType.TOKEN; AAP_STREAMING=0 to disable) +
  GET /tasks/{id}/events replay + UI live typing render
- Ask-mode approval flow (C) — gated tool blocks → UI banner (Allow/Deny) → resume.
  Proven live in browser (approval-banner.png / approval-after.png) + in-process e2e
  (approve→success, deny→permission_denied). 10 min timeout → auto-deny.
- Final answer truncation fix (summary cap 1000 → 20000)
- Overlay/overwrite audit fix: folder-attach → centered modal (scrim, Esc/backdrop close,
  portal to body — TopBar backdrop-blur trap fixed); approval banner → in-flow (never covers
  messages); attach toast → portal. Baaki sab overlays audited — koi content overwrite nahi.
- UI Phase: CENTER tabs (CHAT | PROCESS live timeline+event feed | FILES tree+preview),
  RIGHT inspector rail (active task / live activity / approvals history / provider health,
  collapsible), BOTTOM status bar (conn+safety+scope | event ticker | counts). Proven by
  phase-process.png / phase-files.png / phase-rail.png.
- Backend additions for UI: GET /project/file (guarded), GET /approvals history,
  /system provider_health; FIXED: /project/upload decorator jo tree-edit mein toota tha.
- FAKE REMOVAL: lib/mock/sidebar.ts deleted; Tools/Agents/Sources/Integrations/Files panels
  ab 100% backend-live (/system tools+roles, events, project tree). Dead buttons, fake personas,
  do-nothing switches, Hinglish prompt — sab hata.
- WIRING W1+W2+W3: Sources panel ← live research evidence (sub_agent_result sources, real URLs
  proven); Tools/Agents switches ← REAL backend gating (POST /system/tools/{id}/enabled,
  /system/roles/{role}/enabled; disabled tool → disabled_by_user, disabled role → planner remap,
  in-process + HTTP proven); chips already wired. Harness 18/18.
