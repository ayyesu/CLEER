import { useEffect, useState } from 'react';
import { VERSION, TAG, RELEASE_DATE, ASSETS, Asset } from './version';

/**
 * The release workflow commits `website/public/version.json` to the default branch
 * on every release. Fetching it at runtime (instead of only compiling `version.ts`
 * into the bundle) guarantees the site always shows the current release, even when
 * the deployed build predates the release.
 */
const RAW_VERSION_URL =
  'https://raw.githubusercontent.com/ayyesu/CLEER/main/website/public/version.json';

export interface ReleaseInfo {
  version: string;
  tag: string;
  publishedAt: string;
  assets: Asset[];
}

const compiled: ReleaseInfo = {
  version: VERSION,
  tag: TAG,
  publishedAt: RELEASE_DATE,
  assets: ASSETS,
};

interface VersionJson {
  version?: string;
  tag?: string;
  publishedAt?: string;
  assets?: Asset[];
}

async function fetchVersionJson(url: string): Promise<VersionJson | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as VersionJson;
    if (!data || typeof data.version !== 'string' || !data.version) return null;
    return data;
  } catch {
    return null;
  }
}

// Fetch once and share the result across all components that display the version.
let sharedPromise: Promise<ReleaseInfo | null> | null = null;

function loadRelease(): Promise<ReleaseInfo | null> {
  if (!sharedPromise) {
    sharedPromise = (async () => {
      const [sameOrigin, githubMain] = await Promise.all([
        fetchVersionJson('/version.json'),
        fetchVersionJson(RAW_VERSION_URL),
      ]);

      // Pick the source with the freshest publish timestamp; prefer the GitHub
      // copy when neither has one, since the workflow always updates it.
      const candidates = [githubMain, sameOrigin].filter(
        (c): c is VersionJson => c !== null
      );
      if (candidates.length === 0) return null;

      const best = candidates.sort((a, b) => {
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        if (ta !== tb) return tb - ta;
        // Same timestamp (or none) — GitHub main is the authoritative release source.
        return a === githubMain ? -1 : 1;
      })[0];

      return {
        version: best.version ?? compiled.version,
        tag: best.tag || `v${best.version}`,
        publishedAt: best.publishedAt || compiled.publishedAt,
        assets: Array.isArray(best.assets) && best.assets.length > 0 ? best.assets : compiled.assets,
      };
    })();
  }
  return sharedPromise;
}

export function useRelease(): ReleaseInfo {
  const [info, setInfo] = useState<ReleaseInfo>(compiled);

  useEffect(() => {
    let cancelled = false;

    loadRelease().then((loaded) => {
      if (!cancelled && loaded) setInfo(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
