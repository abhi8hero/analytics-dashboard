import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';

interface SiteContextValue {
  sites: string[];           // all known domains
  activeSite: string;        // '' = all sites
  setActiveSite: (s: string) => void;
  siteFilter: string | null; // null = no filter, string = filter by domain
}

const SiteContext = createContext<SiteContextValue>({
  sites: [],
  activeSite: '',
  setActiveSite: () => {},
  siteFilter: null,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<string[]>([]);
  const [activeSite, setActiveSite] = useState('');

  // Load distinct tracked domains from page_views on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('page_views')
        .select('site_domain')
        .not('site_domain', 'is', null)
        .order('site_domain', { ascending: true });

      if (data) {
        const unique = [...new Set(data.map((r) => r.site_domain as string).filter(Boolean))];
        setSites(unique);
      }
    }
    load();
  }, []);

  return (
    <SiteContext.Provider
      value={{
        sites,
        activeSite,
        setActiveSite,
        siteFilter: activeSite || null,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
