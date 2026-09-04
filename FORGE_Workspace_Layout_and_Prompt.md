# 🔥 FORGE WORKSPACE — Complete Layout & AI Prompt
## RAG-V2 · Interactive Agent Command Center

---

## 📐 VISUAL LAYOUT ARCHITECTURE

### Overall Structure: "JARVIS Glass Command Center"
> Resizable | Draggable | Glassmorphism | Dark Space Theme | Cyan/Indigo Glow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION BAR (64px) — Glass Fixed Header                                    │
├──────────────┬──────────────────────────────────────────────┬───────────────────────┤
│              │                                              │                       │
│  LEFT        │         MAIN WORKSPACE PANEL GRID            │   RIGHT               │
│  SIDEBAR     │         (Resizable & Draggable)              │   SIDEBAR             │
│  (260px)     │                                              │   (300px)             │
│              │   ┌─────────────────┐ ┌─────────────────┐   │                       │
│  📁 FILES    │   │  PANEL 1        │ │  PANEL 2        │   │   🤖 AGENT CONTROL    │
│  🤖 AGENTS   │   │  EXECUTION      │ │  RESEARCH &     │   │   ⚡ TOOL MANAGER     │
│  🛠️ TOOLS    │   │  DASHBOARD      │ │  CONTEXT        │   │   📊 CONTEXT VARS     │
│  📚 SOURCES  │   │                 │ │                 │   │   📋 TASK QUEUE       │
│  🔗 INTEGR.  │   └─────────────────┘ └─────────────────┘   │                       │
│              │                                              │                       │
│              │   ┌─────────────────────────────────────────┐│                       │
│              │   │  PANEL 3 — OUTPUT CANVAS / CONSOLE    ││                       │
│              │   │  (Terminal | Code Editor | Preview)    ││                       │
│              │   └─────────────────────────────────────────┘│                       │
│              │                                              │                       │
├──────────────┴──────────────────────────────────────────────┴───────────────────────┤
│  BOTTOM COMMAND BAR (56px) — Chat Input | Terminal Toggle | Status Indicators      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 ZONE-BY-ZONE DETAILED BREAKDOWN

---

### 1️⃣ TOP NAVIGATION BAR (Fixed, 64px, z-50)

**Glassmorphism Header** — `backdrop-blur-2xl bg-slate-950/40 border-b border-white/[0.08]`

| Position | Element | Details |
|----------|---------|---------|
| **Left** | `◀ Home` Button | Circular, hover glow, returns to landing page |
| | **FORGE** Logo | "FORGE" in bold gradient text `from-cyan-400 to-indigo-400`, subtitle "WORKSPACE" in `text-[10px] tracking-[0.3em] uppercase text-slate-500` |
| **Center** | Project Name Input | Editable, glass input field, placeholder "Untitled Project", auto-save indicator |
| | Breadcrumb Trail | `Project > Session > Task` with chevron separators, clickable |
| **Right** | Agent Status Orb | 3 states: 🔴 Idle / 🟡 Processing / 🟢 Active — with **live pulse ring animation** |
| | Notification Bell | Icon with red dot badge, dropdown panel for alerts |
| | Quick Settings | Gear icon, dropdown: Theme, Layout Reset, Zen Mode, Keyboard Shortcuts |
| | User Avatar | Circular with online indicator, dropdown menu |

**Micro-interactions:**
- Hover on any icon: `scale-110` + cyan glow shadow
- Active state: `bg-white/10` with subtle border glow
- Status orb: CSS keyframe pulse animation `0 0 0 0 rgba(56,189,248,0.4)` → `0 0 0 12px rgba(56,189,248,0)`

---

### 2️⃣ LEFT SIDEBAR (260px, Collapsible, z-40)

**Surface:** `bg-slate-950/60 backdrop-blur-xl border-r border-white/[0.06]`

**5 Accordion Sections** (each with icon + label + chevron):

#### 📁 PROJECT EXPLORER
- **File Tree:** Collapsible folders, file icons by extension, git status colored dots (green=added, yellow=modified, red=deleted)
- **Drag & Drop:** Reorder files, drag into workspace panels
- **Context Menu:** Right-click → New File/Folder, Rename, Delete, Copy Path
- **Search Filter:** Real-time file search input at top of section
- **Quick Actions:** "New File +", "Upload", "Collapse All" buttons

#### 🤖 AGENT LIBRARY
- **Agent Cards:** Avatar (circular with gradient ring), Name, Model badge (GPT-4/Claude/Local), Status dot
- **Active Agent:** Highlighted with cyan left border glow
- **Categories:** Recent, Favorites, Custom, System
- **Actions:** "New Agent" button (opens config modal), Duplicate, Edit, Delete

#### 🛠️ TOOL BOX
- **Categories:** Web (🌐), Code (💻), File (📄), Database (🗄️), Custom (⚙️)
- **Tool Cards:** Icon, Name, Description (2 lines), Toggle switch (enable/disable)
- **Tool Details:** Hover expands card to show: Input schema, Output type, Rate limit, Last used
- **Quick Toggle:** Master "Enable All" / "Disable All" per category

#### 📚 KNOWLEDGE BASE
- **Source List:** Each source = icon (URL=🔗, PDF=📕, DB=🗃️), Name, Document count, Last synced
- **RAG Status:** Green pulse = connected, Red = disconnected, Yellow = syncing
- **Actions:** "Add Source" button, Refresh sync, Remove source
- **Chunk Preview:** Click source → see top 5 chunks with similarity preview

#### 🔗 INTEGRATIONS
- **Connected Services:** GitHub, Slack, Notion, Google Drive, etc.
- **Connection Status:** OAuth connected / disconnected with toggle
- **Sync Settings:** Auto-sync frequency, conflict resolution

**Sidebar Behavior:**
- Collapse to 64px icon-only mode (hover to peek)
- Resizable width (min 200px, max 400px)
- Active section persists in localStorage

---

### 3️⃣ MAIN WORKSPACE — PANEL GRID (Center, Fluid)

**Container:** `react-grid-layout` or similar — draggable, resizable, snap-to-grid

**Default Layout (3 Panels):**

---

#### 🎯 PANEL 1: EXECUTION DASHBOARD (Top-Left, ~55% width, ~55% height)

**Purpose:** See exactly what the agent is thinking and doing in real-time.

**Sub-Components:**

**A. Agent Thought Tree**
- Vertical timeline with connected nodes
- Each step = circular node + card
- Node states: ⏳ Pending (gray) / 🔄 Processing (cyan pulse) / ✅ Complete (green) / ❌ Error (red)
- **Expandable Cards:** Click to see full reasoning, sub-steps, tool calls
- **Branching:** If agent explores multiple paths, show parallel branches

**B. Current Action Card (Prominent)**
- Large card with glowing cyan border when active
- Shows: Action icon, Action name (e.g., "🔍 Performing web search..."), Target/Query, Progress bar, ETA
- **Live Log Stream:** Mini terminal inside showing real-time output (last 5 lines)

**C. Action History Timeline**
- Horizontal scrollable strip at bottom
- Each action = mini card with timestamp, duration, status
- Click to jump back to that state
- Filter: All | Success | Error | User Override

**D. Override Control Bar (Sticky at bottom)**
- Buttons: ⏸️ Pause / ⏹️ Stop / 🔄 Retry / ✅ Approve & Continue / ✏️ Edit Instruction
- **Human-in-the-Loop:** When agent needs approval, show modal overlay with Approve/Reject/Modify

**Animations:**
- New nodes slide in from top with `y: -20, opacity: 0 → y: 0, opacity: 1`
- Processing nodes have continuous border glow pulse
- Completed nodes get a subtle green flash

---

#### 🔍 PANEL 2: RESEARCH & CONTEXT (Top-Right, ~45% width, ~55% height)

**Purpose:** All external knowledge, search results, and retrieved context in one place.

**Tabbed Interface (4 Tabs):**

**Tab 1: 🔎 Search Results**
- Result cards: Title, URL/favicon, snippet (3 lines), relevance score badge
- **Source Chips:** Colored tags indicating source type (Web, KB, Internal)
- **Click to Expand:** Full content preview in modal
- **Pin Result:** Star icon → pins to Context Memory
- **Filter Bar:** Source type dropdown, Date range, Relevance threshold slider

**Tab 2: 📄 RAG Chunks**
- Retrieved document chunks with **highlighted matching terms**
- Metadata: Source doc, Page/Section, Similarity score (0-100%)
- **Re-rank Toggle:** "Most Relevant" / "Most Recent" / "Source Order"
- **Chunk Inspector:** Click to see surrounding context (±3 chunks)

**Tab 3: 📌 Pinned Context**
- User-pinned findings and agent memory items
- Each item = Card with: Content preview, Source, Timestamp, Delete button
- **Drag to Reorder:** Priority affects agent attention
- **Edit Mode:** Inline editing of pinned items
- **Export:** "Save as Note" or "Add to Knowledge Base"

**Tab 4: 🌐 Live Browser (Optional Advanced)**
- Mini iframe or screenshot preview of web pages being browsed
- Agent highlights elements it's interacting with
- **Screenshot Gallery:** Thumbnails of visited pages

---

#### 🖥️ PANEL 3: OUTPUT CANVAS (Bottom, Full Width, ~45% height)

**Purpose:** The actual output of agent work — code, files, visualizations, logs.

**Tabbed Interface (5 Tabs):**

**Tab 1: 🖥️ Terminal / Console**
- Full terminal emulator feel
- Color-coded output: White (info), Cyan (agent), Yellow (warning), Red (error), Green (success)
- **Timestamps:** Toggle on/off, format: `HH:MM:SS.ms`
- **Auto-scroll:** Follow bottom, pause on hover
- **Search:** `Ctrl+F` to search logs
- **Export:** Download as .log file
- **Clear:** Trash icon with confirmation

**Tab 2: 📝 Code Editor**
- Monaco-style editor (or CodeMirror)
- Syntax highlighting for 20+ languages
- **Line numbers, minimap, fold regions**
- **Agent Changes:** Green sidebar for additions, red for deletions
- **Actions:** Copy, Download, Run (if executable), Diff view
- **File Tabs:** Multiple open files, draggable tabs

**Tab 3: 🎨 Artifact Preview**
- Renders HTML, SVG, Markdown, Images, Charts, Tables
- **Safe Sandbox:** iframe isolation for HTML/SVG
- **Zoom Controls:** In/Out/Fit/100%
- **Download:** PNG, SVG, PDF export
- **Interactive:** If artifact has buttons/forms, they work in preview

**Tab 4: 📊 Data View**
- Table view for JSON/CSV data
- Sortable columns, filter rows, pagination
- **Chart Toggle:** Convert table to Bar/Line/Pie chart (using Recharts/Chart.js)
- **Export:** CSV, JSON, Excel

**Tab 5: 🎨 Canvas Mode (Creative Workspace)**
- Infinite whiteboard with pan/zoom
- **Elements:** Sticky notes, text boxes, arrows, shapes, images
- **Agent Drawings:** Agent can generate mind maps, flowcharts, diagrams
- **Collaboration:** Multi-user cursors (if applicable)
- **Templates:** Mind map, Flowchart, SWOT, User Journey

---

### 4️⃣ RIGHT SIDEBAR (300px, Collapsible, z-40)

**Surface:** Same glass as left sidebar, `border-l` instead of `border-r`

**4 Sections:**

#### 🤖 AGENT CONFIGURATION
- **Model Selector:** Dropdown with model cards (GPT-4o, Claude 3.5, Llama 3, etc.) showing context window and speed badges
- **Temperature Slider:** 0.0 to 1.0, with labels "Precise → Creative", real-time value display
- **Max Tokens:** Number input with +/-/preset buttons (1k, 4k, 8k, 128k)
- **System Prompt:** Expandable textarea with character count, template presets
- **Advanced:** Top-p, Frequency penalty, Presence penalty (collapsible)
- **Save Preset:** "Save as Default" button

#### ⚡ ACTIVE TOOLS
- **Enabled Tools List:** Each tool = icon + name + toggle switch + settings gear
- **Tool Groups:** Collapsible by category
- **Live Indicators:** Tool currently in use gets cyan pulse animation
- **Quick Add:** "+ Add Tool" button opens Tool Box modal
- **Execution Limits:** Max calls per minute, timeout settings

#### 📊 CONTEXT VARIABLES (Shared Memory)
- **Key-Value Table:** Variable name, value (truncated), type badge (string/number/json), edit/delete
- **Add Variable:** "+ New Var" button, opens key-value input modal
- **Import/Export:** JSON upload/download
- **Agent Memory:** Toggle "Allow agent to modify variables"
- **Session vs Persistent:** Badge showing scope

#### 📋 EXECUTION QUEUE
- **Task List:** Each task = priority badge (P1-P4), task name, agent assigned, status, ETA
- **Status:** Queued (gray) / Running (cyan pulse) / Paused (yellow) / Complete (green) / Failed (red)
- **Actions:** Pause/Resume individual tasks, Reorder (drag), Cancel, Retry failed
- **Queue Controls:** "Pause All", "Clear Completed", "Export Queue"
- **History:** Toggle to see last 50 completed tasks

---

### 5️⃣ BOTTOM COMMAND BAR (Fixed, 56px, z-50)

**Glass Surface:** `backdrop-blur-2xl bg-slate-950/60 border-t border-white/[0.08]`

**Layout:**

| Position | Element |
|----------|---------|
| **Left (15%)** | 🖥️ Terminal Toggle (slide up panel) / 🔄 Layout Reset / ⛶ Zen Mode |
| **Center (70%)** | **Rich Chat Input Area** |
| **Right (15%)** | Connection Status Dot + Label / Token Counter (`14.2k / 128k`) / Version Badge `v0.1` |

#### Rich Chat Input (The Star)
- **Container:** Glass pill shape, `bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(56,189,248,0.15)]`
- **Textarea:** Auto-resize (min 1 row, max 5 rows), placeholder: "Command the agent... (⌘K for commands)"
- **Left Actions:**
  - 📎 Attachment: File, image, PDF upload (drag-drop supported)
  - 🎤 Voice Input: Hold to record, waveform visualization while recording
  - 📎 Context: Attach from Knowledge Base
- **Right Actions:**
  - ⏩ Send Button: Cyan gradient, glow on hover, `scale-105` on active
  - ⌄ Expand: Full-screen composer mode
- **Slash Commands:** Type `/` → popup menu with:
  - `/search [query]` — Web search
  - `/code [language]` — Code generation
  - `/file [path]` — Read/edit file
  - `/run [command]` — Execute shell command
  - `/agent [name]` — Switch agent
  - `/clear` — Clear context
  - `/help` — Show all commands

**Typing Indicator:**
- When agent is responding, show animated "●●●" with "Agent is thinking..." label
- Waveform animation for voice mode

---

## 🎨 PREMIUM DESIGN SYSTEM

### Color Palette
```
Backgrounds:
  --bg-void:        #020617    (Deepest space — page bg)
  --bg-surface:     #0f172a    (Panel backgrounds)
  --bg-elevated:    #1e293b    (Hover, active states)
  --bg-input:       rgba(255,255,255,0.05)  (Input fields)

Accents:
  --accent-cyan:    #38bdf8    (Primary — active, focus, glow)
  --accent-indigo:  #818cf8    (Secondary — gradients, badges)
  --accent-purple:  #c084fc    (Tertiary — highlights, special states)
  --glow-cyan:      rgba(56,189,248,0.15)   (Box shadows)
  --glow-indigo:    rgba(129,140,248,0.15)

Text:
  --text-primary:   #f8fafc    (Headings, primary content)
  --text-secondary: #94a3b8    (Labels, descriptions)
  --text-muted:     #64748b    (Disabled, placeholders)
  --text-inverse:   #0f172a    (On light badges)

Semantic:
  --success:        #4ade80    (Complete, connected, success)
  --warning:        #fbbf24    (Warning, pending, attention)
  --error:          #f87171    (Error, failed, disconnected)
  --info:           #38bdf8    (Info, processing, active)

Borders:
  --border-subtle:  rgba(255,255,255,0.06)
  --border-default: rgba(255,255,255,0.10)
  --border-focus:   rgba(56,189,248,0.40)
```

### Typography
```
Font Families:
  --font-ui:        'Inter', system-ui, sans-serif
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace
  --font-display:   'Inter', sans-serif  (for headings)

Scale:
  --text-xs:        11px   (Labels, badges, tracking-widest uppercase)
  --text-sm:        13px   (Secondary text, descriptions)
  --text-base:      14px   (Body, UI elements)
  --text-md:        16px   (Important UI, inputs)
  --text-lg:        18px   (Panel headers, section titles)
  --text-xl:        24px   (Major headings)
  --text-2xl:       32px   (Page titles)

Weights:
  --font-normal:    400
  --font-medium:    500
  --font-semibold:  600
  --font-bold:      700
```

### Spacing & Shape
```
Border Radius:
  --radius-sm:      6px    (Buttons, badges, small elements)
  --radius-md:      10px   (Cards, inputs, panels)
  --radius-lg:      16px   (Modals, large containers)
  --radius-xl:      24px   (Floating elements, orbs)
  --radius-full:    9999px (Avatars, pills, status dots)

Shadows:
  --shadow-sm:      0 1px 2px rgba(0,0,0,0.3)
  --shadow-md:      0 4px 12px rgba(0,0,0,0.4)
  --shadow-lg:      0 8px 24px rgba(0,0,0,0.5)
  --shadow-glow-cyan: 0 0 20px rgba(56,189,248,0.15)
  --shadow-glow-indigo: 0 0 30px rgba(129,140,248,0.10)
```

### Effects & Animations
```
Glassmorphism:
  backdrop-filter: blur(24px)
  background: rgba(15, 23, 42, 0.6)
  border: 1px solid rgba(255, 255, 255, 0.08)

Glow Effects:
  Active panel: box-shadow 0 0 30px rgba(56,189,248,0.08)
  Hover card: box-shadow 0 4px 20px rgba(56,189,248,0.10)
  Focus input: box-shadow 0 0 0 2px rgba(56,189,248,0.2), 0 0 20px rgba(56,189,248,0.15)

Transitions:
  --transition-fast:    150ms cubic-bezier(0.4, 0, 0.2, 1)
  --transition-base:    250ms cubic-bezier(0.4, 0, 0.2, 1)
  --transition-slow:    400ms cubic-bezier(0.4, 0, 0.2, 1)
  --transition-spring:  500ms cubic-bezier(0.34, 1.56, 0.64, 1)

Key Animations:
  - Pulse Ring:    scale 0.8→1.2, opacity 0.6→0, infinite, 2s
  - Shimmer:       background-position -200%→200%, 2s, infinite
  - Slide In:      translateY(20px)→0, opacity 0→1, 300ms
  - Fade In:       opacity 0→1, 200ms
  - Scale Pop:     scale 0.95→1, opacity 0→1, 200ms, spring
```

### Background System
- **Starry Particle Canvas:** Full-page fixed background (same as Home page)
  - 150-200 particles, varying sizes (1-3px)
  - Slow drift animation (0.2-0.5px/frame)
  - Random twinkle opacity (0.3-1.0)
  - Cyan/white colored, subtle parallax on mouse move
- **Gradient Orbs:** 2-3 large blurred circles (`300-500px`) in slate-900/indigo-950, slow drift, `opacity-20`
- **Grid Overlay:** Optional subtle dot grid `rgba(255,255,255,0.03)` for technical feel

---

## 🚀 PREMIUM INTERACTIVE FEATURES

### 1. Draggable Panel System
- **react-grid-layout** implementation
- Drag panel headers to rearrange
- Resize from corners/edges
- **Snap to Grid:** 20px grid for clean alignment
- **Save Layout:** Per-project layout persistence in localStorage
- **Reset Layout:** One-click return to default
- **Maximize Panel:** Double-click header to fullscreen, Esc to restore

### 2. Command Palette (`Ctrl/Cmd + K`)
- **Modal Overlay:** Centered, glass, 600px wide
- **Search:** Fuzzy search across all actions, files, agents, tools
- **Categories:** Recent, Files, Agents, Tools, Navigation, Settings
- **Keyboard Navigation:** Arrow keys + Enter
- **Shortcuts Display:** Show keybinding next to each action

### 3. Floating Agent Orb
- **Position:** Bottom-right, 64px from edges, z-50
- **Appearance:** Circular avatar (agent face/icon) with **3 rotating concentric rings** in cyan/indigo
- **States:**
  - Idle: Slow rotation, dim glow
  - Processing: Fast rotation, bright cyan glow, pulse animation
  - Error: Red tint, stopped rotation, shake animation
- **Click:** Opens quick agent menu (switch agent, view status, pause)
- **Drag:** Can be repositioned on screen

### 4. Toast Notification System
- **Position:** Top-right stack, max 5 toasts
- **Types:** Success (green), Error (red), Warning (yellow), Info (cyan)
- **Content:** Icon, Title, Message, Timestamp, Action buttons
- **Auto-dismiss:** 5 seconds, progress bar at bottom
- **Hover:** Pause auto-dismiss

### 5. Zen Mode
- **Trigger:** Button in top bar or `Ctrl/Cmd + .`
- **Effect:** Hide both sidebars and bottom bar, only workspace panels + floating chat input (center-bottom, glass pill)
- **Exit:** Press Esc or click "Exit Zen" floating button
- **Animation:** Sidebars slide out, workspace expands, 400ms spring

### 6. Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command Palette |
| `Ctrl+Enter` | Send message |
| `Ctrl+Shift+Enter` | Send with context clear |
| `Ctrl+B` | Toggle left sidebar |
| `Ctrl+J` | Toggle right sidebar |
| `Ctrl+.` | Zen mode toggle |
| `Ctrl+T` | Toggle terminal panel |
| `Ctrl+1-5` | Switch workspace tabs |
| `Ctrl+R` | Retry last action |
| `Ctrl+P` | Pause/Resume agent |
| `Esc` | Close modals, exit zen |

### 7. Loading & Empty States
- **Skeleton Screens:** Shimmer effect on panels while loading content
- **Empty States:** Illustrative icons + helpful text + CTA button
  - Example: "No files yet. Upload or create a new file."
- **Agent Thinking:** Animated waveform, "Agent is reasoning..." with step hints

### 8. Context-Aware Tooltips
- **Hover Tooltips:** Every icon/button has a tooltip with name + shortcut
- **Delay:** 400ms hover delay, instant on focused elements
- **Style:** Glass pill, `text-xs`, `px-2 py-1`

### 9. Split View
- Any panel can be split:
  - **Vertical Split:** Right-click header → "Split Right"
  - **Horizontal Split:** Right-click header → "Split Down"
- **Maximum:** 4 panels in 2x2 grid
- **Drag to Merge:** Drag panel onto another to merge

### 10. Session Persistence
- **Auto-save:** Every 30 seconds
- **Restore:** On reload, restore all panels, files, context variables, chat history
- **Snapshots:** "Save Snapshot" button to bookmark current state
- **History:** Browse previous sessions in sidebar

---

## 📱 RESPONSIVE BEHAVIOR

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥1440px)** | Full 3-column layout, both sidebars visible |
| **Laptop (1024-1439px)** | Right sidebar auto-collapses to icon mode |
| **Tablet (768-1023px)** | Left sidebar collapses to icon mode, right sidebar hidden (toggle button) |
| **Mobile (<768px)** | Single column, bottom sheet for sidebars, simplified panels |

---

---

# 🤖 AI AGENT PROMPT — PHASE BY PHASE

> **Copy and paste the following prompt into your AI coding agent.**
> This is designed for **phase-by-phase execution** to ensure quality at each step.

---

```
================================================================================
PROJECT: FORGE WORKSPACE UI — Interactive AI Agent Command Center
PLATFORM: RAG-V2 AI Agent Platform
TYPE: Interactive Workspace (NOT a chat interface)
================================================================================

OVERVIEW:
Build the FORGE workspace — a premium, glassmorphism-based, highly interactive 
command center where users work alongside AI agents. This is the INTERACTIVE MODE 
of the platform (as opposed to NOVA's autonomous chat mode). Users handle files, 
research, tools, and see live execution in draggable panels.

DESIGN PHILOSOPHY:
- JARVIS-style futuristic command center
- Dark space theme with animated starry background
- Heavy glassmorphism (backdrop-blur, translucent surfaces)
- Cyan (#38bdf8) and Indigo (#818cf8) accent glows
- Every element must feel alive with micro-interactions
- Consistent with the home page's space aesthetic

================================================================================
PHASE 1: FOUNDATION & THEME SETUP
================================================================================

GOAL: Set up the project structure, global styles, and background system.

TASKS:
1. Initialize project with React + TypeScript + Vite (or Next.js if preferred)
2. Install dependencies:
   - Tailwind CSS (with custom config)
   - Framer Motion (animations)
   - react-grid-layout (draggable panels)
   - lucide-react (icons)
   - @monaco-editor/react (code editor)
   - recharts (charts, optional)
   - zustand or jotai (state management)
   - react-hot-toast or sonner (notifications)

3. Configure Tailwind with custom design tokens:
   - Colors: bg-void (#020617), bg-surface (#0f172a), accent-cyan (#38bdf8), 
     accent-indigo (#818cf8), all semantic colors
   - Font families: Inter (UI), JetBrains Mono (code)
   - Border radius, shadows, transitions as specified in design system
   - Custom animations: pulse-ring, shimmer, slide-in, fade-in

4. Build the Starry Background Component:
   - Full-screen fixed canvas with 150-200 particles
   - Particles: white/cyan, sizes 1-3px, slow drift, twinkle effect
   - Mouse parallax: particles move slightly opposite to mouse
   - 2-3 large gradient orbs (slate-900/indigo-950) drifting slowly
   - MUST match the home page background aesthetic

5. Build the Glassmorphism Base Components:
   - GlassPanel: Reusable panel with backdrop-blur, bg-white/5, border-white/10
   - GlassCard: Smaller variant for inner content
   - GlassInput: Input field with glass styling and focus glow
   - GlassButton: Button variants (primary cyan glow, secondary, ghost)
   - Badge: Status badges with colors
   - Tooltip: Context-aware tooltip component

DELIVERABLE: A working page with the starry background and glass components 
demo (storybook-style or simple showcase).

================================================================================
PHASE 2: TOP NAVIGATION & LAYOUT SHELL
================================================================================

GOAL: Build the fixed header and main layout shell with collapsible sidebars.

TASKS:
1. Top Navigation Bar (64px, fixed, z-50):
   - Left: Home button (circular, hover glow) + FORGE logo with gradient text
   - Center: Editable project name input (auto-save) + breadcrumb trail
   - Right: Agent Status Orb (3 states with pulse animation), Notification bell 
     with dropdown, Settings gear with dropdown menu, User avatar
   - Glassmorphism: backdrop-blur-2xl, bg-slate-950/40, border-b border-white/10
   - All icons: hover scale-110 + cyan glow shadow

2. Left Sidebar (260px, collapsible):
   - 5 accordion sections: Project Explorer, Agent Library, Tool Box, 
     Knowledge Base, Integrations
   - Each section: Icon + label + chevron, collapsible
   - Collapse to 64px icon-only mode
   - Resizable width (min 200px, max 400px)
   - Persist active section in localStorage
   - Darker glass: bg-slate-950/60

3. Right Sidebar (300px, collapsible):
   - 4 sections: Agent Configuration, Active Tools, Context Variables, 
     Execution Queue
   - Same glass style, border-l
   - Collapsible to icon mode

4. Bottom Command Bar (56px, fixed):
   - Left: Terminal toggle, Layout reset, Zen mode buttons
   - Right: Connection status dot, Token counter (e.g., "14.2k / 128k"), 
     Version badge
   - Glass: backdrop-blur-2xl, bg-slate-950/60, border-t

5. Main Workspace Area (center, fluid):
   - Container for draggable panel grid
   - Calculate remaining space after top/bottom bars and sidebars

DELIVERABLE: Full layout shell with working sidebar collapse/expand, 
resizable sidebars, and responsive behavior.

================================================================================
PHASE 3: MAIN WORKSPACE — PANEL GRID SYSTEM
================================================================================

GOAL: Implement the draggable, resizable panel grid with default layout.

TASKS:
1. Integrate react-grid-layout:
   - 3 default panels in grid layout
   - Panel A (Execution Dashboard): Top-left, ~55% width, ~55% height
   - Panel B (Research & Context): Top-right, ~45% width, ~55% height
   - Panel C (Output Canvas): Bottom, full width, ~45% height
   - Drag from panel headers to rearrange
   - Resize from corners/edges
   - Snap to 20px grid
   - Save/restore layout from localStorage
   - Reset layout button
   - Maximize panel on double-click header

2. Panel Header Component:
   - Title with icon, drag handle (6-dot grip), minimize/maximize/close buttons
   - Glass styling, subtle bottom border
   - Tab bar if panel has multiple tabs

3. Panel Content Wrapper:
   - Scrollable area with custom scrollbar (thin, cyan thumb)
   - Loading skeleton state
   - Empty state with illustration and CTA

4. Panel Resize Behavior:
   - Smooth spring animation on drop
   - Visual grid lines during drag (optional)
   - Minimum sizes enforced (300px x 200px)

DELIVERABLE: Working panel grid with 3 panels that can be dragged, resized, 
maximized, and reset. Layout persists on reload.

================================================================================
PHASE 4: PANEL A — EXECUTION DASHBOARD
================================================================================

GOAL: Build the agent thought tree and live execution view.

TASKS:
1. Agent Thought Tree:
   - Vertical timeline with connected SVG line
   - Nodes: Circular, 3 states (Pending gray, Processing cyan pulse, 
     Complete green, Error red)
   - Expandable cards: Click to see full reasoning, sub-steps, tool calls
   - Branching support for parallel exploration paths
   - Animation: New nodes slide in from top (y: -20→0, opacity 0→1, 300ms)

2. Current Action Card:
   - Prominent card with glowing cyan border when active
   - Action icon, name (e.g., "🔍 Performing web search..."), target/query
   - Progress bar with percentage
   - Mini live log stream (last 5 lines, auto-scroll)
   - Shimmer effect while processing

3. Action History Timeline:
   - Horizontal scrollable strip at bottom of panel
   - Mini cards: Timestamp, duration, status icon
   - Click to jump back to that state
   - Filter tabs: All | Success | Error | User Override

4. Override Control Bar:
   - Sticky at bottom of panel
   - Buttons: Pause ⏸️, Stop ⏹️, Retry 🔄, Approve ✅, Edit ✏️
   - Human-in-the-loop modal: When agent needs approval, overlay with 
     Approve/Reject/Modify options
   - Button states: Disabled when agent idle, pulsing when action required

5. Mock Data System:
   - Create realistic mock agent execution flow
   - 8-10 steps: Planning → Search → Analyze → Code → Verify → Complete
   - Simulate processing delays to test animations

DELIVERABLE: Fully animated Execution Dashboard with mock data demonstrating 
all states and interactions.

================================================================================
PHASE 5: PANEL B — RESEARCH & CONTEXT
================================================================================

GOAL: Build the research results and context management panel.

TASKS:
1. Tabbed Interface (4 tabs):
   - Tab bar with icons and labels, active tab has cyan underline glow
   - Smooth tab switching animation (fade + slight slide)

2. Search Results Tab:
   - Result cards: Title, favicon/URL, snippet (3 lines), relevance score badge
   - Source chips: Colored tags (Web=blue, KB=green, Internal=purple)
   - Pin button (star) to add to Context Memory
   - Click to expand in modal with full content
   - Filter bar: Source type dropdown, date range, relevance threshold slider
   - Mock 10-15 realistic search results

3. RAG Chunks Tab:
   - Retrieved chunks with highlighted matching terms (yellow background)
   - Metadata: Source document, page/section, similarity score (0-100%)
   - Re-rank toggle: Most Relevant / Most Recent / Source Order
   - Chunk inspector: Click to see ±3 surrounding chunks
   - Mock 8-10 chunks with varying scores

4. Pinned Context Tab:
   - Card list of pinned items
   - Each card: Content preview (2 lines), source badge, timestamp, delete button
   - Drag to reorder (priority affects agent)
   - Inline edit mode (click to edit content)
   - Export: "Save as Note" or "Add to Knowledge Base" buttons
   - Mock 3-5 pinned items

5. Live Browser Tab (Optional/Advanced):
   - Placeholder for iframe/screenshot preview
   - Screenshot gallery grid
   - Agent highlight overlay simulation

DELIVERABLE: Research panel with all 4 tabs, mock data, and working 
pin/reorder/filter interactions.

================================================================================
PHASE 6: PANEL C — OUTPUT CANVAS
================================================================================

GOAL: Build the multi-tab output area for code, terminal, previews, and canvas.

TASKS:
1. Tabbed Interface (5 tabs):
   - Terminal, Code Editor, Artifact Preview, Data View, Canvas Mode
   - Same tab bar style as Panel B

2. Terminal / Console Tab:
   - Full terminal feel: Black background (#000000), monospace font
   - Color-coded output: White (info), Cyan (agent), Yellow (warning), 
     Red (error), Green (success)
   - Timestamps: Toggle on/off, format HH:MM:SS.ms
   - Auto-scroll to bottom, pause on hover
   - Search: Ctrl+F with highlight
   - Export: Download as .log
   - Clear: Trash icon with confirmation modal
   - Mock 50+ log lines showing realistic agent execution

3. Code Editor Tab:
   - Monaco Editor integration (@monaco-editor/react)
   - Syntax highlighting for JS, TS, Python, HTML, CSS, JSON, etc.
   - Line numbers, minimap, fold regions
   - Agent change indicators: Green sidebar (additions), red (deletions)
   - Actions: Copy, Download, Run, Diff view buttons
   - File tabs: Multiple open files, draggable, close button
   - Mock 2-3 sample files

4. Artifact Preview Tab:
   - Renders: HTML (safe iframe), SVG, Markdown (rendered), Images, 
     Charts, Tables
   - Zoom controls: In/Out/Fit/100%
   - Download: PNG, SVG, PDF export buttons
   - Mock: HTML dashboard, SVG logo, Markdown report

5. Data View Tab:
   - Table view for JSON/CSV with sortable columns
   - Filter rows input, pagination
   - Chart toggle: Convert to Bar/Line/Pie using Recharts
   - Export: CSV, JSON
   - Mock: User analytics dataset (50 rows)

6. Canvas Mode Tab:
   - Infinite whiteboard with pan (drag background) and zoom (scroll)
   - Toolbar: Sticky note, text box, arrow, rectangle, circle, image
   - Agent-generated elements: Mock mind map about "AI Agent Architecture"
   - Sticky notes with glass styling
   - Selection box, delete key to remove

DELIVERABLE: Output Canvas with all 5 functional tabs and realistic mock content.

================================================================================
PHASE 7: LEFT SIDEBAR — CONTENT SECTIONS
================================================================================

GOAL: Populate the left sidebar with functional content.

TASKS:
1. Project Explorer:
   - File tree with nested folders (src, components, assets, docs)
   - File icons by extension (JSX, TS, CSS, JSON, MD, PNG, etc.)
   - Git status dots on files
   - Drag and drop to reorder (within tree)
   - Context menu on right-click (New, Rename, Delete, Copy Path)
   - Search filter at top
   - Quick action buttons: New File +, Upload, Collapse All
   - Mock realistic project structure (15-20 files)

2. Agent Library:
   - Agent cards: Gradient ring avatar, name, model badge, status dot
   - Categories: Recent, Favorites, Custom, System
   - Active agent: Cyan left border glow, "Active" badge
   - Actions: New Agent (opens modal), Duplicate, Edit, Delete
   - Mock 6 agents with different models

3. Tool Box:
   - Categories: Web, Code, File, Database, Custom
   - Tool cards: Icon, name, description (2 lines), toggle switch
   - Hover expands to show: Input schema, output type, rate limit, last used
   - Master toggle per category
   - Mock 12 tools

4. Knowledge Base:
   - Source list: Icon, name, document count, last synced time
   - RAG status: Green pulse (connected), red (disconnected), yellow (syncing)
   - Actions: Add Source, Refresh, Remove
   - Mock 4 sources (2 URLs, 1 PDF, 1 Database)

5. Integrations:
   - Service cards: GitHub, Slack, Notion, Google Drive
   - Connection status with toggle
   - Sync settings
   - Mock 3 connected, 1 disconnected

DELIVERABLE: Fully populated left sidebar with all 5 sections, realistic mock 
data, and working interactions (expand/collapse, toggle, context menus).

================================================================================
PHASE 8: RIGHT SIDEBAR — CONFIGURATION PANELS
================================================================================

GOAL: Build the agent configuration and control panels.

TASKS:
1. Agent Configuration:
   - Model Selector: Dropdown with model cards showing name, provider, 
     context window badge (e.g., "128k"), speed indicator
   - Temperature Slider: 0.0 to 1.0, labels "Precise → Creative", 
     real-time value display, step 0.1
   - Max Tokens: Number input with +/- buttons and presets (1k, 4k, 8k, 128k)
   - System Prompt: Expandable textarea (min 3 rows, max 10), character count, 
     template preset buttons ("Default", "Coder", "Researcher")
   - Advanced (collapsible): Top-p slider, Frequency penalty, Presence penalty
   - Save Preset button
   - All controls update global state immediately

2. Active Tools:
   - List of enabled tools with icon + name + toggle switch + settings gear
   - Grouped by category (collapsible)
   - Currently active tool gets cyan pulse animation on its icon
   - Quick Add button opens Tool Box modal
   - Execution limits: Max calls/min, timeout input
   - Mock 8 tools, 5 enabled

3. Context Variables:
   - Key-value table: Name, value (truncated with ellipsis), type badge 
     (string/number/json), edit pencil, delete trash
   - Add Variable: Modal with key input, value textarea, type selector, 
     scope toggle (Session vs Persistent)
   - Import/Export JSON buttons
   - "Allow agent modification" toggle
   - Mock 5 variables

4. Execution Queue:
   - Task list: Priority badge (P1-P4 with colors), task name, agent badge, 
     status, ETA
   - Status: Queued (gray), Running (cyan pulse), Paused (yellow), 
     Complete (green), Failed (red)
   - Actions per task: Pause/Resume, Cancel, Retry (for failed)
   - Drag to reorder queued tasks
   - Queue controls: Pause All, Clear Completed, Export Queue
   - History toggle: Show last 20 completed tasks
   - Mock 8 tasks (2 running, 3 queued, 2 complete, 1 failed)

DELIVERABLE: Fully functional right sidebar with all configuration controls, 
real-time state updates, and mock queue data.

================================================================================
PHASE 9: BOTTOM COMMAND BAR & CHAT INPUT
================================================================================

GOAL: Build the rich chat input and command interface.

TASKS:
1. Rich Chat Input:
   - Glass pill container: bg-white/5, border-white/10, focus:border-cyan-400/50
   - Auto-resize textarea: min 1 row, max 5 rows, smooth height animation
   - Placeholder: "Command the agent... (⌘K for palette)"
   - Left action buttons: Attachment (file upload), Voice input (hold to record 
     with waveform), Context attach
   - Right: Send button (cyan gradient, glow hover, scale-105 active), 
     Expand composer
   - Typing indicator: Animated dots when agent responds

2. Slash Commands:
   - Type `/` → popup menu with 8 commands
   - Commands: /search, /code, /file, /run, /agent, /clear, /help
   - Each command: Icon, name, description, example
   - Arrow key navigation, Enter to select, Escape to close
   - Auto-fill command template in input

3. File Attachment:
   - Click paperclip → file picker
   - Drag-drop files onto input area
   - Attached file chips: Icon, filename, size, remove X
   - Support: Images, PDFs, code files, text files

4. Voice Input:
   - Hold microphone button → recording state
   - Waveform visualization (canvas, cyan bars)
   - Release to send transcribed text
   - Cancel on drag-away

5. Bottom Bar Left/Right:
   - Left: Terminal toggle (slides up panel), Layout reset, Zen mode
   - Right: Connection status (green dot + "Connected"), Token usage 
     counter with progress bar, version badge

6. Terminal Slide-Up Panel:
   - Click terminal toggle → panel slides up from bottom (400px height)
   - Full terminal with all features from Panel C
   - Close button or click toggle again to hide
   - Resizable height (drag top edge)

DELIVERABLE: Fully functional command bar with rich input, slash commands, 
file attach, voice input, and terminal slide-up.

================================================================================
PHASE 10: ADVANCED FEATURES & POLISH
================================================================================

GOAL: Add premium interactions, system features, and final polish.

TASKS:
1. Command Palette (Ctrl/Cmd + K):
   - Modal overlay, centered, 600px wide, glass
   - Search input at top with search icon
   - Fuzzy search across: Files, Agents, Tools, Actions, Settings
   - Categories with headers, keyboard shortcuts shown
   - Arrow key navigation, Enter to execute
   - Recent commands section
   - Animation: Scale 0.95→1, opacity 0→1, 200ms

2. Floating Agent Orb:
   - Bottom-right, 64px from edges, fixed, z-50
   - Circular avatar with 3 rotating concentric rings (cyan/indigo)
   - States: Idle (slow rotation, dim), Processing (fast, bright pulse), 
     Error (red, shake)
   - Click: Quick menu (switch agent, status, pause)
   - Draggable to reposition
   - Tooltip on hover: "Agent Status: Processing..."

3. Toast Notifications:
   - Top-right stack, max 5 toasts
   - Types: Success (green), Error (red), Warning (yellow), Info (cyan)
   - Content: Icon, title, message, timestamp, action buttons
   - Auto-dismiss: 5s with progress bar, pause on hover
   - Slide in from right, fade out
   - Mock 3 demo toasts on load

4. Zen Mode:
   - Toggle button or Ctrl/Cmd + .
   - Hide both sidebars and bottom bar
   - Workspace panels expand to full width
   - Floating chat input (center-bottom, glass pill, minimal)
   - "Exit Zen" floating button (top-right, auto-hide)
   - Smooth 400ms spring animation

5. Keyboard Shortcuts Modal:
   - Accessible from settings or `?` key
   - Categorized list: Navigation, Panels, Agent, General
   - Search shortcuts
   - Show keybinding in command palette tooltips

6. Split View:
   - Right-click panel header → "Split Right" / "Split Down"
   - Max 4 panels in 2x2 grid
   - Drag to merge panels
   - Each split panel independent

7. Session Persistence:
   - Auto-save layout, open files, context variables every 30s to localStorage
   - On reload: Restore everything exactly as left
   - "Save Snapshot" button to bookmark state
   - Snapshot browser in left sidebar

8. Responsive Behavior:
   - Desktop (≥1440px): Full layout
   - Laptop: Right sidebar icon-mode
   - Tablet: Both sidebars hidden, toggle buttons
   - Mobile: Bottom sheets for sidebars, single column

9. Final Polish:
   - Custom scrollbar (thin, cyan thumb, dark track)
   - Loading skeletons on all panels
   - Empty states with illustrations
   - Hover glows on every interactive element
   - Focus rings with cyan glow
   - Smooth page transitions
   - Error boundaries with fallback UI
   - Performance: React.memo, useMemo, useCallback where needed

DELIVERABLE: Complete, production-ready FORGE workspace with all premium 
features, animations, and polish.

================================================================================
CRITICAL DESIGN REQUIREMENTS (Apply to ALL phases)
================================================================================

1. BACKGROUND CONTINUITY:
   - The starry particle canvas from the home page MUST continue here
   - Same particle count, colors, drift speed, twinkle behavior
   - Same gradient orbs
   - This creates seamless visual continuity between Home → Forge

2. GLASSMORPHISM CONSISTENCY:
   - Every panel, card, input, button uses the same glass formula
   - backdrop-blur range: 12px to 24px depending on layer
   - Background alpha: 0.05 to 0.10 (never opaque)
   - Border: 1px solid rgba(255,255,255,0.08) to 0.10

3. GLOW SYSTEM:
   - Active/focused elements: Cyan glow (rgba(56,189,248,0.15) to 0.30)
   - Hover: Subtle lift + glow
   - Never use solid borders for active states — always glow

4. ANIMATION QUALITY:
   - All transitions: 200-400ms, ease-out or spring
   - No jarring instant changes
   - Loading states: Shimmer, not spinners
   - Agent activity: Pulse, glow, rotation — feels alive

5. TYPOGRAPHY HIERARCHY:
   - Section headers: text-xs, uppercase, tracking-widest, text-slate-400
   - Panel titles: text-sm, font-semibold, text-slate-200
   - Body: text-sm to text-base, text-slate-300
   - Code/terminal: JetBrains Mono, text-xs to text-sm

6. EMPTY & LOADING STATES:
   - Never show blank panels
   - Loading: Shimmer skeleton matching content shape
   - Empty: Icon + helpful text + CTA button
   - Error: Red-tinted panel with retry button

7. ACCESSIBILITY:
   - All interactive elements keyboard accessible
   - Focus visible states (cyan ring)
   - ARIA labels on icons
   - Color not sole indicator (icons + text + borders)

================================================================================
TECH STACK SUMMARY
================================================================================

Frontend:
  - React 18+ with TypeScript
  - Vite (or Next.js 14+ with App Router)
  - Tailwind CSS 3.4+ (custom config with design tokens)
  - Framer Motion (all animations, AnimatePresence, layout animations)
  - react-grid-layout (draggable/resizable panels)
  - lucide-react (all icons)
  - @monaco-editor/react (code editing)
  - recharts (data visualization)
  - zustand (global state management)
  - sonner (toast notifications)

Optional but Recommended:
  - react-hotkeys-hook (keyboard shortcuts)
  - use-sound (subtle UI sounds — optional)
  - react-virtualized (large lists performance)

================================================================================
MOCK DATA REQUIREMENTS
================================================================================

Provide realistic mock data for ALL sections:
- Project: Realistic file tree (React/Node project structure)
- Agents: 6 agents with names like "CodeForge", "ResearchBot", "DocuMind"
- Tools: 12 tools (WebSearch, CodeExecutor, FileManager, GitHub, etc.)
- Knowledge: 4 sources (docs, API ref, design system, database)
- Queue: 8 tasks with realistic names and statuses
- Execution: 8-10 step agent flow with reasoning
- Search: 10-15 results about AI/tech topics
- RAG: 8-10 chunks from documentation
- Terminal: 50+ realistic log lines
- Code: 2-3 sample files (React component, Python script, Config)
- Data: 50-row user analytics dataset
- Canvas: Mind map about "Multi-Agent Architecture"

================================================================================
FINAL OUTPUT EXPECTATIONS
================================================================================

The completed FORGE workspace should feel like:
- A futuristic JARVIS-style command center
- Premium glass surfaces with depth and light
- Alive — every element responds to interaction
- Professional enough for enterprise use
- Cool enough for developers to love

It must maintain PERFECT visual continuity with the RAG-V2 home page:
- Same starry background
- Same glass aesthetic
- Same color palette
- Same "intelligent system" personality

================================================================================
END OF PROMPT
================================================================================
```

---

## ✅ CHECKLIST FOR DEVELOPER

Before handing off to AI agent, verify:
- [ ] All 10 phases are clearly defined with specific tasks
- [ ] Design system colors, typography, spacing are specified
- [ ] Mock data requirements are listed
- [ ] Tech stack is confirmed
- [ ] Critical requirements section is emphasized
- [ ] Background continuity with home page is explicitly required
- [ ] Every interactive element has defined hover/focus/active states
- [ ] Responsive breakpoints are specified
- [ ] Accessibility requirements are included

---

*Generated for RAG-V2 · FORGE Workspace · Premium Interactive Agent Command Center*
