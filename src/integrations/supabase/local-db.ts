// Local in-browser database that mimics the small subset of the Supabase
// PostgREST/JS client used by this app. No real backend is required.
// Everything is persisted to localStorage so data survives refreshes.

type Row = Record<string, any>;
const STORE_KEY = "bottolat_local_db_v1";
const FILES_KEY = "bottolat_local_files_v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type DB = Record<string, Row[]>;

function loadDB(): DB {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}
let db: DB = loadDB();

function saveDB() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("local-db save failed", e);
  }
}

function table(name: string): Row[] {
  if (!db[name]) db[name] = [];
  return db[name];
}

// ---- table defaults applied on insert ----
function applyDefaults(name: string, row: Row): Row {
  const now = new Date().toISOString();
  const base: Row = { id: row.id || uuid(), created_at: row.created_at || now };
  const withUpdated = { ...base, updated_at: row.updated_at || now };
  let defaults: Row = {};
  switch (name) {
    case "tournaments":
      defaults = {
        type: "knockout", status: "draft", num_teams: 8, num_groups: 4,
        teams_per_group: 4, current_round: 1, venue_photos: [], sport_type: "football",
        league_legs: 1, has_playoff: false, playoff_teams: 4, accept_join_requests: false,
        is_open: false, auto_draw: true, registration_closed: false, qualifiers_per_group: 2,
        ...withUpdated,
      };
      break;
    case "teams":
      defaults = { is_eliminated: false, player_names: [], player_photos: [], player_info: [], ...base };
      break;
    case "matches":
      defaults = {
        home_score: 0, away_score: 0, round: 1, match_order: 1, status: "scheduled",
        leg: 1, home_yellow_cards: 0, away_yellow_cards: 0, home_red_cards: 0,
        away_red_cards: 0, scorers: [], man_of_the_match: null, ...withUpdated,
      };
      break;
    case "standings":
      defaults = {
        played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0,
        points: 0, position: 0, ...withUpdated,
      };
      break;
    case "join_requests":
      defaults = { status: "pending", player_names: [], player_photos: [], ...withUpdated };
      break;
    case "profiles":
      defaults = { ...withUpdated };
      break;
    default:
      defaults = { ...base };
  }
  const merged = { ...defaults, ...row };
  if (name === "standings") {
    merged.goal_difference = (merged.goals_for || 0) - (merged.goals_against || 0);
  }
  return merged;
}

// ---- realtime-ish event bus for channel subscriptions ----
type Listener = (table: string) => void;
const listeners = new Set<Listener>();
function notify(name: string) {
  listeners.forEach((l) => {
    try { l(name); } catch { /* noop */ }
  });
}

// ---- query builder ----
type Filter = { type: "eq" | "in" | "is" | "not"; col: string; val: any; op?: string };
type Order = { col: string; ascending: boolean };

class QueryBuilder<T = any> implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private returnRows = false;
  private wantSingle: "single" | "maybe" | null = null;
  private headOnly = false;
  private countMode = false;
  private payload: any = null;

  constructor(private name: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.op = "select";
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.headOnly = true;
    this.returnRows = true;
    return this;
  }
  insert(rows: any) {
    this.op = "insert";
    this.payload = rows;
    return this;
  }
  update(obj: any) {
    this.op = "update";
    this.payload = obj;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: any) { this.filters.push({ type: "eq", col, val }); return this; }
  in(col: string, val: any[]) { this.filters.push({ type: "in", col, val }); return this; }
  is(col: string, val: any) { this.filters.push({ type: "is", col, val }); return this; }
  not(col: string, op: string, val: any) { this.filters.push({ type: "not", col, val, op }); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.wantSingle = "single"; return this; }
  maybeSingle() { this.wantSingle = "maybe"; return this; }

  private match(row: Row): boolean {
    return this.filters.every((f) => {
      if (f.type === "eq") return row[f.col] === f.val;
      if (f.type === "in") return (f.val || []).includes(row[f.col]);
      if (f.type === "is") return (row[f.col] ?? null) === (f.val ?? null);
      if (f.type === "not") {
        if (f.op === "is") return (row[f.col] ?? null) !== (f.val ?? null);
        return row[f.col] !== f.val;
      }
      return true;
    });
  }

  private run(): { data: any; error: any; count: number | null } {
    const rows = table(this.name);
    try {
      if (this.op === "insert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted = items.map((it) => applyDefaults(this.name, { ...it }));
        rows.push(...inserted);
        saveDB();
        notify(this.name);
        const data = this.returnRows
          ? this.wantSingle ? inserted[0] ?? null : inserted
          : null;
        return { data, error: null, count: inserted.length };
      }
      if (this.op === "update") {
        const now = new Date().toISOString();
        let n = 0;
        for (const r of rows) {
          if (this.match(r)) {
            Object.assign(r, this.payload, { updated_at: now });
            if (this.name === "standings") {
              r.goal_difference = (r.goals_for || 0) - (r.goals_against || 0);
            }
            n++;
          }
        }
        saveDB();
        notify(this.name);
        return { data: null, error: null, count: n };
      }
      if (this.op === "delete") {
        const remaining = rows.filter((r) => !this.match(r));
        const removed = rows.length - remaining.length;
        db[this.name] = remaining;
        saveDB();
        notify(this.name);
        return { data: null, error: null, count: removed };
      }
      // select
      let result = rows.filter((r) => this.match(r));
      for (let i = this.orders.length - 1; i >= 0; i--) {
        const o = this.orders[i];
        result = [...result].sort((a, b) => {
          const av = a[o.col], bv = b[o.col];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return o.ascending ? -1 : 1;
          if (av > bv) return o.ascending ? 1 : -1;
          return 0;
        });
      }
      const count = result.length;
      if (this.limitN != null) result = result.slice(0, this.limitN);
      if (this.headOnly) return { data: null, error: null, count };
      const cloned = result.map((r) => ({ ...r }));
      if (this.wantSingle === "single") return { data: cloned[0] ?? null, error: null, count };
      if (this.wantSingle === "maybe") return { data: cloned[0] ?? null, error: null, count };
      return { data: cloned, error: null, count };
    } catch (error) {
      return { data: null, error, count: null };
    }
  }

  then<R1 = any, R2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count: number | null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return Promise.resolve(this.run()).then(onfulfilled as any, onrejected as any);
  }
}

// ---- storage (data-URL based) ----
function loadFiles(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(FILES_KEY) || "{}"); } catch { return {}; }
}
const files: Record<string, string> = loadFiles();
function saveFiles() {
  try { localStorage.setItem(FILES_KEY, JSON.stringify(files)); } catch { /* too big, keep in-memory only */ }
}
function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
function storageFrom(bucket: string) {
  return {
    async upload(path: string, file: Blob, _opts?: { upsert?: boolean }) {
      const key = `${bucket}/${path}`;
      files[key] = await fileToDataUrl(file);
      saveFiles();
      return { data: { path }, error: null };
    },
    getPublicUrl(path: string) {
      const key = `${bucket}/${path}`;
      return { data: { publicUrl: files[key] || "" } };
    },
  };
}

// ---- RPC ----
async function rpc(name: string, params: any): Promise<{ data: any; error: any }> {
  if (name === "create_league_tournament_full") {
    const names: string[] = params.p_team_names || [];
    if (!names || names.length < 2) return { data: null, error: { message: "Need at least 2 teams" } };
    const legs = params.p_league_legs ?? 1;
    const tRes = new QueryBuilder("tournaments").insert({
      name: params.p_name, type: "league", status: "upcoming", start_date: params.p_start_date,
      num_teams: names.length, owner_id: params.p_owner_id, logo_url: params.p_logo_url,
      venue_name: params.p_venue_name, venue_address: params.p_venue_address,
      referee_name: params.p_referee_name, venue_photos: params.p_venue_photos || [],
      sport_type: params.p_sport_type || "football", age_category: params.p_age_category,
      volleyball_format: params.p_volleyball_format, season: params.p_season,
      league_legs: legs, has_playoff: params.p_has_playoff ?? false,
      playoff_teams: params.p_playoff_teams ?? 4,
    }).select().single();
    const { data: tournament } = await tRes;
    const tid = tournament.id;
    const teamIds: string[] = [];
    for (let i = 0; i < names.length; i++) {
      const { data: team } = await new QueryBuilder("teams")
        .insert({ tournament_id: tid, name: names[i], seed: i + 1 }).select().single();
      teamIds.push(team.id);
      await new QueryBuilder("standings").insert({ tournament_id: tid, team_id: team.id });
    }
    let round = 0;
    const matches: Row[] = [];
    for (let leg = 1; leg <= legs; leg++) {
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          round++;
          matches.push({
            tournament_id: tid,
            home_team_id: leg === 1 ? teamIds[i] : teamIds[j],
            away_team_id: leg === 1 ? teamIds[j] : teamIds[i],
            round, match_order: round, status: "scheduled", leg, stage: "league",
          });
        }
      }
    }
    if (matches.length) await new QueryBuilder("matches").insert(matches);
    return { data: tid, error: null };
  }
  return { data: null, error: { message: `Unknown RPC: ${name}` } };
}

// ---- edge functions (local fallbacks) ----
const functions = {
  async invoke(name: string, opts: { body?: any }) {
    if (name === "ai-draw") {
      const { teams = [], tournamentType, numGroups } = opts.body || {};
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      if (tournamentType === "groups" && numGroups) {
        const groups: Record<string, string[]> = {};
        const perGroup = Math.ceil(shuffled.length / numGroups);
        for (let i = 0; i < numGroups; i++) {
          groups[String.fromCharCode(65 + i)] = shuffled.slice(i * perGroup, (i + 1) * perGroup);
        }
        return { data: { groups }, error: null };
      }
      return { data: { draw: shuffled }, error: null };
    }
    return { data: null, error: { message: `Unknown function: ${name}` } };
  },
};

// ---- channels (realtime emulation) ----
function channel(_name: string) {
  const subs: { table: string; cb: () => void }[] = [];
  const api = {
    on(_event: string, config: { table?: string; event?: string; schema?: string; filter?: string }, cb: () => void) {
      subs.push({ table: config.table || "", cb });
      return api;
    },
    subscribe() {
      const listener: Listener = (tbl) => {
        subs.forEach((s) => { if (!s.table || s.table === tbl) s.cb(); });
      };
      listeners.add(listener);
      (api as any)._listener = listener;
      return api;
    },
    unsubscribe() {
      const l = (api as any)._listener as Listener | undefined;
      if (l) listeners.delete(l);
      return Promise.resolve({ error: null });
    },
  };
  return api;
}

// ---- auth stub ----
const auth = {
  async getSession() { return { data: { session: null }, error: null }; },
  async getUser() { return { data: { user: null }, error: null }; },
  onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
  async signOut() { return { error: null }; },
};

export const supabase = {
  from: (name: string) => new QueryBuilder(name),
  rpc,
  storage: { from: storageFrom },
  functions,
  channel,
  auth,
};
