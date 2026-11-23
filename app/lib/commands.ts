/* The Command Window's interpreter: a small, safe subset of classic MATLAB
   (arithmetic, magic, rand, disp, who/whos, ls/dir, lookfor, type, pwd, clc …)
   plus the commands that drive this page (open, show, sort, web, activity,
   git log). Pure: it takes
   the input and a snapshot of the page, and returns the lines to print and at
   most one action for the component to carry out. Nothing here is eval'd. */

export type CmdRow = {
  id: string;
  name: string;
  file: string;
  dateShort: string;
  statusText: string;
  summary: string;
  skills: string[];
  vars: { name: string; value: string }[];
  githubUrl?: string;
  videoUrl?: string;
};

/** One line of recent activity, with its age already worked out on the server. */
export type CmdFeedItem = { kind: string; title: string; detail?: string; when: string; url: string; sha?: string };

/** A channel `web NAME` can open: youtube, substack, x. */
export type CmdChannel = { key: string; name: string; url: string };

export type CmdAction =
  | { type: "open"; id: string }
  | { type: "activity" }
  | { type: "clear" }
  | { type: "filter"; filter: string }
  | { type: "sort"; sort: string }
  | { type: "web"; url: string }
  | { type: "exit" };

export type CmdCtx = {
  rows: CmdRow[];
  /** What Current Folder is listing right now, in order (`open 3` means the third of these). */
  shown: CmdRow[];
  selected: CmdRow;
  /** Filter keys the page actually offers — an empty one would filter to nothing. */
  filters: string[];
  ans: number | null;
  /** Recent activity, newest first (empty when no feed could be read). */
  feed: CmdFeedItem[];
  channels: CmdChannel[];
};

export type CmdResult = {
  out: string[];
  error?: boolean;
  action?: CmdAction;
  /** New value of ans; undefined leaves it alone, null clears it. */
  ans?: number | null;
};

const SORT_KEYS = ["new", "old", "done"];

// ---- numbers ---------------------------------------------------------------

export function fmt(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n > 0 ? "Inf" : "-Inf";
  if (Number.isInteger(n) && Math.abs(n) < 1e9) return String(n);
  const a = Math.abs(n);
  if (a >= 1e5 || a < 1e-3) return n.toExponential(4);
  return n.toFixed(4);
}

class UnknownName extends Error {
  name: string;
  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  abs: Math.abs,
  exp: Math.exp,
  log: Math.log,
  log2: Math.log2,
  log10: Math.log10,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  fix: Math.trunc,
  sign: Math.sign,
};

/** expr := term (± term)*, term := unary (×÷ unary)*, power is right-associative. */
export function evaluate(src: string, ans: number | null): number {
  const tokens = src.match(/\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|[-+*/^()]|\S/g) ?? [];
  let pos = 0;
  const peek = () => tokens[pos];
  const bad = (): never => {
    throw new Error("Invalid expression");
  };

  function expr(): number {
    let v = term();
    while (peek() === "+" || peek() === "-") v = tokens[pos++] === "+" ? v + term() : v - term();
    return v;
  }
  function term(): number {
    let v = unary();
    while (peek() === "*" || peek() === "/") v = tokens[pos++] === "*" ? v * unary() : v / unary();
    return v;
  }
  function unary(): number {
    if (peek() === "-") {
      pos++;
      return -unary();
    }
    if (peek() === "+") {
      pos++;
      return unary();
    }
    return power();
  }
  function power(): number {
    const base = primary();
    if (peek() === "^") {
      pos++;
      return Math.pow(base, unary());
    }
    return base;
  }
  function primary(): number {
    const t = tokens[pos++];
    if (t === undefined) return bad();
    if (/^[\d.]/.test(t)) {
      const v = Number(t);
      return Number.isNaN(v) ? bad() : v;
    }
    if (t === "(") {
      const v = expr();
      if (tokens[pos++] !== ")") bad();
      return v;
    }
    if (/^[A-Za-z_]/.test(t)) {
      if (t === "pi") return Math.PI;
      if (t === "Inf" || t === "inf") return Infinity;
      if (t === "NaN") return NaN;
      if (t === "ans") {
        if (ans === null) throw new UnknownName("ans");
        return ans;
      }
      if (t === "rand") {
        if (peek() === "(" && tokens[pos + 1] === ")") pos += 2;
        return Math.random();
      }
      const f = FUNCS[t];
      if (!f) throw new UnknownName(t);
      if (tokens[pos++] !== "(") bad();
      const v = expr();
      if (tokens[pos++] !== ")") bad();
      return f(v);
    }
    return bad();
  }

  const v = expr();
  if (pos !== tokens.length) bad();
  return v;
}

// ---- magic squares (MATLAB's own construction) ----------------------------

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function magic(n: number): number[][] {
  if (n === 1) return [[1]];
  if (n === 2) return [[4, 3], [1, 2]];
  if (n % 2 === 1) {
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => {
        const i = r + 1;
        const j = c + 1;
        return n * mod(i + j - (n + 3) / 2, n) + mod(i + 2 * j - 2, n) + 1;
      })
    );
  }
  if (n % 4 === 0) {
    const A = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));
    const flip = (idx: number[]) => {
      for (const r of idx) for (const c of idx) A[r - 1][c - 1] = n * n + 1 - A[r - 1][c - 1];
    };
    const range = (from: number) => {
      const out: number[] = [];
      for (let i = from; i <= n; i += 4) out.push(i);
      return out;
    };
    flip([...range(1), ...range(4)]);
    flip([...range(2), ...range(3)]);
    return A;
  }
  const p = n / 2;
  const sub = magic(p);
  const M = [
    ...sub.map((row) => [...row, ...row.map((x) => x + 2 * p * p)]),
    ...sub.map((row) => [...row.map((x) => x + 3 * p * p), ...row.map((x) => x + p * p)]),
  ];
  const k = (n - 2) / 4;
  const swap = (i: number, cols: number[]) => {
    for (const c of cols) [M[i - 1][c - 1], M[i - 1 + p][c - 1]] = [M[i - 1 + p][c - 1], M[i - 1][c - 1]];
  };
  const cols: number[] = [];
  for (let c = 1; c <= k; c++) cols.push(c);
  for (let c = n - k + 2; c <= n; c++) cols.push(c);
  for (let i = 1; i <= p; i++) swap(i, cols);
  swap(k + 1, [1, k + 1]);
  return M;
}

function matrixLines(m: number[][]): string[] {
  const digits = String(Math.max(...m.flat())).length;
  const w = Math.max(6, digits + 3);
  return m.map((row) => row.map((x) => String(x).padStart(w)).join(""));
}

// ---- helpers ---------------------------------------------------------------

const unquote = (s: string) => s.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
const ok = (...out: string[]): CmdResult => ({ out });
const fail = (...out: string[]): CmdResult => ({ out, error: true });
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function findProject(arg: string, ctx: CmdCtx): CmdRow | null {
  const a = unquote(arg);
  if (/^\d+$/.test(a)) return ctx.shown[Number(a) - 1] ?? null;
  const low = a.toLowerCase().replace(/\.mlx$/, "");
  if (!low) return null;
  const dashed = low.replace(/\s+/g, "-");
  return (
    ctx.rows.find((r) => r.id === low || r.id === dashed) ??
    ctx.rows.find((r) => r.name.toLowerCase() === low) ??
    ctx.rows.find((r) => r.name.toLowerCase().includes(low) || r.id.includes(dashed)) ??
    null
  );
}

const USAGE: Record<string, string> = {
  ls: "ls             List the projects in the Current Folder (also: dir).",
  open: "open NAME      Open a project by name, file or list number (also: edit, load, cd).\n               open pitv    open 3    open('Lit Explorer')",
  lookfor: "lookfor WORD   Search project names and skills.   lookfor python",
  type: "type NAME      Print a project's one-line summary.",
  who: "who            List the Workspace variables (whos adds their values).",
  web: "web github     Open the project's GitHub page.   web video   opens its YouTube video.\n               web youtube   web substack   web x   open a channel.",
  activity: "activity       Open activity.mlx and list the newest posts and commits (also: news, whatsnew).",
  git: "git log        The latest commit on each recently pushed repo.",
  show: "show FILTER    Filter the folder: all, complete, progress, other.",
  sort: "sort ORDER     Sort the folder: new, old, done (most complete).",
  pwd: "pwd            Print the current folder.",
  clc: "clc            Clear the Command Window (clear also resets ans).",
  date: "date           Print today's date.",
  version: "version        About this browser (also: ver).",
  exit: "exit           Back to the home page (also: quit, cd ..).",
  help: "help [NAME]    List the commands, or describe one (also: doc).",
  cd: "cd NAME        Open a project like open does; cd .. goes to the home page.",
  clear: "clear          Clear the window and forget ans.",
  magic: "magic(N)       An N-by-N magic square, N from 1 to 12.",
  disp: "disp(X)        Print a number or text without 'ans ='.   disp('hello')",
};

const ALIASES: Record<string, string> = {
  dir: "ls",
  edit: "open",
  load: "open",
  run: "open",
  doc: "help",
  whos: "who",
  quit: "exit",
  ver: "version",
  news: "activity",
  whatsnew: "activity",
};

const HELP_ORDER = ["ls", "open", "lookfor", "type", "who", "web", "activity", "git", "show", "sort", "pwd", "clc", "date", "version", "exit"];

const COMMANDS: Record<string, (arg: string, ctx: CmdCtx, raw: string) => CmdResult> = {
  help(arg) {
    const key = ALIASES[unquote(arg)] ?? unquote(arg);
    if (key) return USAGE[key] ? ok(USAGE[key]) : fail(`No help found for '${key}'.`);
    return ok(
      "Commands (help NAME for details):",
      `  ${HELP_ORDER.join("  ")}`,
      "Works like MATLAB:",
      "  2+2   sqrt(16)/2   pi   magic(4)   rand   disp('hello')   ans",
      "Up and down arrows recall earlier commands; Tab completes names."
    );
  },
  ls(_arg, ctx) {
    const w = Math.min(30, Math.max(4, ...ctx.shown.map((r) => r.name.length)));
    return ok(
      ...ctx.shown.map((r, i) => `${String(i + 1).padStart(2)}  ${clip(r.name, w).padEnd(w)}  ${r.statusText.padEnd(11)}  ${r.dateShort}`)
    );
  },
  open(arg, ctx) {
    if (!unquote(arg)) return fail("Not enough input arguments.", "Try:  open pitv   or   open 3   (ls lists the projects)");
    const r = findProject(arg, ctx);
    if (!r) return fail("Error using open", `Unable to find '${unquote(arg)}'. Type ls to list the projects.`);
    return { out: [`Opening ${r.file}`], action: { type: "open", id: r.id } };
  },
  cd(arg, ctx) {
    const a = unquote(arg);
    if (!a) return ok("/peninsula/projects");
    if (a === ".." || a === "/") return { out: ["Returning to the home page…"], action: { type: "exit" } };
    return COMMANDS.open(a, ctx, a);
  },
  lookfor(arg, ctx) {
    const w = unquote(arg).toLowerCase();
    if (!w) return fail("Not enough input arguments.", "Try:  lookfor python");
    const hits = ctx.rows
      .map((r) => ({ r, skills: r.skills.filter((s) => s.toLowerCase().includes(w)) }))
      .filter(({ r, skills }) => skills.length > 0 || r.name.toLowerCase().includes(w));
    if (!hits.length) return ok(`No projects mention '${unquote(arg)}'.`);
    const width = Math.max(...hits.map(({ r }) => r.file.length));
    return ok(...hits.map(({ r, skills }) => `${r.file.padEnd(width)}  ${r.name}${skills.length ? `  (${skills.join(", ")})` : ""}`));
  },
  type(arg, ctx) {
    const r = arg ? findProject(arg, ctx) : ctx.selected;
    if (!r) return fail("Error using type", `Unable to find '${unquote(arg)}'.`);
    return ok(`% ${r.file}`, `% ${r.summary}`);
  },
  who(_arg, ctx, raw) {
    const vars = ctx.selected.vars;
    if (/^whos\b/.test(raw)) {
      const w = Math.max(...vars.map((v) => v.name.length));
      return ok("  Name".padEnd(w + 4) + "Value", ...vars.map((v) => `  ${v.name.padEnd(w + 2)}${v.value}`));
    }
    return ok("Your variables are:", "", vars.map((v) => v.name).join("  "));
  },
  web(arg, ctx) {
    const a = unquote(arg).toLowerCase();
    if (!a) return fail("Not enough input arguments.", "Try:  web github   or   web video");
    const channel = ctx.channels.find((c) => c.key === a);
    if (channel) return { out: [`Opening ${channel.name}…`], action: { type: "web", url: channel.url } };
    const url = a === "github" ? ctx.selected.githubUrl : a === "video" ? ctx.selected.videoUrl : undefined;
    if (a !== "github" && a !== "video") return fail(`web opens ${["github", "video", ...ctx.channels.map((c) => c.key)].map((k) => `'${k}'`).join(", ")}, not '${unquote(arg)}'.`);
    if (!url) return fail(`${ctx.selected.name} has no ${a} link.`);
    return { out: [`Opening ${a} for ${ctx.selected.name}…`], action: { type: "web", url } };
  },
  show(arg, ctx) {
    const a = unquote(arg).toLowerCase();
    if (!ctx.filters.includes(a)) return fail(`Try:  ${ctx.filters.map((f) => `show ${f}`).join("   ")}`);
    return { out: [`Showing: ${a}`], action: { type: "filter", filter: a } };
  },
  sort(arg) {
    const a = unquote(arg).toLowerCase();
    if (!SORT_KEYS.includes(a)) return fail("Try:  sort new   sort old   sort done");
    return { out: [`Sorted by: ${a}`], action: { type: "sort", sort: a } };
  },
  activity(_arg, ctx) {
    if (!ctx.feed.length) return fail("No recent activity could be read just now. Try again in a few minutes.");
    const shown = ctx.feed.slice(0, 6);
    const w = Math.max(...shown.map((f) => f.when.length));
    const k = Math.max(...shown.map((f) => f.kind.length));
    return {
      out: ["Opening activity.mlx", ...shown.map((f) => `  ${f.when.padEnd(w)}  ${f.kind.padEnd(k)}  ${clip(f.title, 44)}`)],
      action: { type: "activity" },
    };
  },
  git(arg, ctx) {
    const sub = unquote(arg).split(/\s+/)[0]?.toLowerCase();
    if (sub === "status") return ok("On branch main", "nothing to commit, working tree clean");
    if (sub !== "log") return fail(`git: only 'git log' works here${sub ? `, not 'git ${sub}'` : ""}.`);
    const commits = ctx.feed.filter((f) => f.sha);
    if (!commits.length) return fail("No commits could be read from GitHub just now.");
    const w = Math.max(...commits.map((c) => c.title.length));
    return ok(...commits.map((c) => `${c.sha}  ${c.title.padEnd(w)}  ${clip(c.detail ?? "", 52)}  (${c.when})`));
  },
  pwd() {
    return ok("/peninsula/projects");
  },
  clc() {
    return { out: [], action: { type: "clear" } };
  },
  clear() {
    return { out: [], action: { type: "clear" }, ans: null };
  },
  date() {
    const d = new Date();
    const mon = d.toLocaleDateString("en-US", { month: "short" });
    return ok(`ans = '${String(d.getDate()).padStart(2, "0")}-${mon}-${d.getFullYear()}'`);
  },
  version() {
    return ok("ans = 'Project Browser 1.0'", "A MATLAB-style project browser. Not affiliated with MathWorks.");
  },
  exit() {
    return { out: ["Leaving the project browser…"], action: { type: "exit" } };
  },
  magic(arg) {
    const n = Number(arg);
    if (!Number.isInteger(n) || n < 1 || n > 12) return fail("Error using magic", "Argument must be a whole number from 1 to 12.");
    const m = magic(n);
    return ok("ans =", "", ...matrixLines(m), "");
  },
  disp(arg, ctx) {
    if (!arg.trim()) return fail("Not enough input arguments.");
    if (/^(['"])[\s\S]*\1$/.test(arg.trim())) return ok(unquote(arg));
    try {
      return ok(fmt(evaluate(arg, ctx.ans)));
    } catch (e) {
      return failure(e);
    }
  },
};

function failure(e: unknown): CmdResult {
  if (e instanceof UnknownName) return fail(`Unrecognized function or variable '${e.name}'.`);
  return fail("Error: Invalid expression.");
}

export const COMMAND_NAMES = [...Object.keys(COMMANDS), ...Object.keys(ALIASES)].sort();

export function runCommand(input: string, ctx: CmdCtx): CmdResult {
  let src = input.trim();
  if (!src || src.startsWith("%")) return ok();
  const quiet = src.endsWith(";");
  if (quiet) src = src.slice(0, -1).trim();

  const call = /^([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/.exec(src);
  const word = /^([A-Za-z_]\w*)(?:\s+([\s\S]+))?$/.exec(src);
  const [name, arg] = call ? [call[1], call[2]] : word ? [word[1], word[2] ?? ""] : ["", ""];
  const cmd = ALIASES[name] ?? name;
  if (cmd && Object.prototype.hasOwnProperty.call(COMMANDS, cmd)) return COMMANDS[cmd](arg.trim(), ctx, name);

  if (/^(['"])[\s\S]*\1$/.test(src)) return ok(`ans = '${unquote(src)}'`);
  try {
    const v = evaluate(src, ctx.ans);
    return { out: quiet ? [] : [`ans = ${fmt(v)}`], ans: v };
  } catch (e) {
    return failure(e);
  }
}

/** Tab completion: the command names for the first word, project names after open-like commands. */
export function complete(line: string, ctx: Pick<CmdCtx, "rows">): string | null {
  const m = /^(\S*)(\s+)?(.*)$/.exec(line.trimStart());
  if (!m) return null;
  const [, head, gap, rest] = m;
  const common = (xs: string[]) => xs.reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
  if (!gap) {
    const hits = COMMAND_NAMES.filter((n) => n.startsWith(head));
    if (!hits.length) return null;
    const c = common(hits);
    return c.length > head.length ? c : hits.length === 1 ? `${hits[0]} ` : null;
  }
  const cmd = ALIASES[head] ?? head;
  if (!["open", "cd", "type"].includes(cmd)) return null;
  const hits = ctx.rows.map((r) => r.id).filter((id) => id.startsWith(rest.toLowerCase()));
  if (!hits.length) return null;
  const c = common(hits);
  return c.length > rest.length ? `${head} ${c}` : null;
}
