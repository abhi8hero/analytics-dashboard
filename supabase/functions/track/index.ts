import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ── Geo-IP via ip-api.com (free, no key needed, local-friendly) ───────────────
async function geoLookup(ip: string) {
  // Skip private / loopback addresses
  if (
  ip === '127.0.0.1' ||
  ip === '::1' ||
  ip.startsWith('192.168.') ||
  ip.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
) {
    return { country: 'Local', country_code: 'LO', region: null, city: null, lat: null, lon: null };
  }

  try {
    const res = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data: {
    status: string;
    country?: string;
    countryCode?: string;
    regionName?: string;
    city?: string;
    lat?: number;
    lon?: number;
  } = await res.json();
    if (data.status !== 'success') return null;
    return {
      country: data.country ?? null,
      country_code: data.countryCode ?? null,
      region: data.regionName ?? null,
      city: data.city ?? null,
      lat: data.lat ?? null,
      lon: data.lon ?? null,
    };
  } catch {
    return null;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      fingerprint,
      session_token,
      page_url,
      page_title,
      referrer_url,
      referrer_domain,
      device_type,
      browser,
      browser_version,
      os,
      os_version,
      screen_resolution,
      language,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      ref_param,
      site_domain,
    } = body;

    // Basic validation
    if (!fingerprint || !session_token || !page_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract real IP from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfIp = req.headers.get('cf-connecting-ip');

    const ip =
      cfIp ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      realIp ||
      '127.0.0.1';

    console.log('Detected IP:', ip);

    const userAgent = req.headers.get('user-agent') || '';

    // ── 1. Upsert visitor ────────────────────────────────────────────────────
    const { data: existingVisitor } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    let visitorId: string;

    if (existingVisitor) {
      visitorId = existingVisitor.id;

      await supabase
        .from('visitors')
        .update({
          last_seen: new Date().toISOString(),
          visit_count: existingVisitor.visit_count + 1,
          is_returning: true,
          ip_address: ip,
          ip_hash: await hashIp(ip),
        })
        .eq('id', visitorId);

      // Update location if current one is missing
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id, country')
        .eq('visitor_id', visitorId)
        .maybeSingle();

      if (!existingLocation || !existingLocation.country || existingLocation.country === 'Local') {
        const geo = await geoLookup(ip);

        console.log('Geo lookup IP:', ip);
        console.log('Geo result:', geo);

        if (geo) {
          if (existingLocation) {
            await supabase
              .from('locations')
              .update({
                country: geo.country,
                country_code: geo.country_code,
                region: geo.region,
                city: geo.city,
                latitude: geo.lat,
                longitude: geo.lon,
              })
              .eq('visitor_id', visitorId);
          } else {
            await supabase.from('locations').insert({
              visitor_id: visitorId,
              country: geo.country,
              country_code: geo.country_code,
              region: geo.region,
              city: geo.city,
              latitude: geo.lat,
              longitude: geo.lon,
            });
          }
        }
      }

    } else {
      const { data: newVisitor, error: visitorErr } = await supabase
        .from('visitors')
        .insert({
          fingerprint,
          ip_address: ip,
          ip_hash: await hashIp(ip),
          is_returning: false,
        })
        .select('id')
        .single();

      if (visitorErr || !newVisitor) {
        throw new Error(`Failed to create visitor: ${visitorErr?.message}`);
      }
      visitorId = newVisitor.id;

      // Geo lookup for new visitors only
      const geo = await geoLookup(ip);
      if (geo) {
        await supabase.from('locations').insert({
          visitor_id: visitorId,
          country: geo.country,
          country_code: geo.country_code,
          region: geo.region,
          city: geo.city,
          latitude: geo.lat,
          longitude: geo.lon,
        });
      }

      // Device info for new visitors
      await supabase.from('devices').insert({
        visitor_id: visitorId,
        device_type,
        browser,
        browser_version,
        os,
        os_version,
        screen_resolution,
        language,
      });
    }

    // ── 2. Upsert session ────────────────────────────────────────────────────
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id, page_count')
      .eq('session_token', session_token)
      .maybeSingle();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
      await supabase
        .from('sessions')
        .update({
          last_activity: new Date().toISOString(),
          page_count: existingSession.page_count + 1,
          is_active: true,
        })
        .eq('id', sessionId);
    } else {
      const { data: newSession, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
          visitor_id: visitorId,
          session_token,
          page_count: 1,
          is_active: true,
          site_domain: site_domain || null,
        })
        .select('id')
        .single();

      if (sessionErr || !newSession) {
        throw new Error(`Failed to create session: ${sessionErr?.message}`);
      }
      sessionId = newSession.id;
    }

    // ── 3. Insert page view ──────────────────────────────────────────────────
    await supabase.from('page_views').insert({
      visitor_id: visitorId,
      session_id: sessionId,
      page_url,
      page_title: page_title || null,
      referrer_url: referrer_url || null,
      referrer_domain: referrer_domain || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      ref_param: ref_param || null,
      site_domain: site_domain || null,
    });

    // ── 4. Log raw event ─────────────────────────────────────────────────────
    await supabase.from('analytics_logs').insert({
      event_type: 'pageview',
      visitor_id: visitorId,
      session_id: sessionId,
      page_url,
      ip_address: ip,
      user_agent: userAgent,
      payload: body,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[track] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple SHA-256 hex hash for IP anonymization
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + '_salt_analytics');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
