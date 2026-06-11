import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';

const SNIPPET_EXTERNAL = `<script
  src="https://YOUR_DASHBOARD_URL/tracker.js"
  data-endpoint="${SUPABASE_URL}/functions/v1/track"
  defer
></script>`;

const SNIPPET_INLINE = `<!-- Analytics Tracker — invisible to visitors -->
<script>
(function(){
  var ENDPOINT = "${SUPABASE_URL}/functions/v1/track";
  /* ... paste contents of tracker.js here ... */
})();
</script>`;

const SNIPPET_REACT = `// In your React app's entry point (main.tsx or index.tsx)
// Paste tracker.js content inside an IIFE inside a useEffect or load it as a <script>
import { useEffect } from 'react';

export function useAnalytics() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://YOUR_DASHBOARD_URL/tracker.js';
    script.dataset.endpoint = '${SUPABASE_URL}/functions/v1/track';
    script.defer = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);
}`;

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs text-foreground overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-card border border-border rounded p-4 flex gap-3">
        <Code className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            How to Track Your Website
          </h3>
          <p className="text-sm text-muted-foreground">
            Add the tracker snippet to your website. It runs silently in the background and is
            completely invisible to your visitors — no banners, no consent popups, no indicators.
          </p>
        </div>
      </div>

      {/* Method 1 */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Method 1 — Script Tag (Recommended)
        </h4>
        <p className="text-xs text-muted-foreground px-1">
          Add this inside the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> or before the closing{' '}
          <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag of every page you want to track.
        </p>
        <CodeBlock code={SNIPPET_EXTERNAL} label="HTML" />
      </div>

      {/* Method 2 */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Method 2 — Inline Script
        </h4>
        <p className="text-xs text-muted-foreground px-1">
          Paste the full contents of{' '}
          <code className="bg-muted px-1 rounded">tracker.js</code> directly into your page for
          zero additional HTTP request.
        </p>
        <CodeBlock code={SNIPPET_INLINE} label="HTML (inline)" />
      </div>

      {/* Method 3 */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Method 3 — React / Vite App
        </h4>
        <p className="text-xs text-muted-foreground px-1">
          Use a custom hook in your React entry point to load the tracker once.
        </p>
        <CodeBlock code={SNIPPET_REACT} label="React (TypeScript)" />
      </div>

      {/* Notes */}
      <div className="bg-muted/50 border border-border rounded p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">What the tracker collects</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Page URL and title</li>
          <li>Referrer URL and domain</li>
          <li>Browser name and version</li>
          <li>Operating system</li>
          <li>Device type (desktop / mobile / tablet)</li>
          <li>Screen resolution</li>
          <li>Browser language</li>
          <li>Anonymous fingerprint (no PII, no real cookies)</li>
          <li>IP address (server-side only, used for geo lookup, optionally hashed)</li>
        </ul>
      </div>
    </div>
  );
}
