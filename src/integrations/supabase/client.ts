// Local, database-free client. Mimics the subset of the Supabase JS API the
// app uses, backed by localStorage. Swap this file out to reconnect a real
// backend later.
import { supabase } from "./local-db";

export { supabase };
