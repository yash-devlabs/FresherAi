import { createUserSupabase } from '../services/supabaseService.js';

export async function requireAuthentication(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'You must be signed in.' });
    const supabase = createUserSupabase(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = data.user;
    req.supabase = supabase;
    next();
  } catch (error) {
    console.error('[fresherai] authentication failed', error);
    res.status(500).json({ message: 'Authentication service is unavailable.' });
  }
}
