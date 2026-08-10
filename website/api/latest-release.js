export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/ayyesu/CLEER/releases/latest',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'cleer-website',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch release' });
    }

    const data = await response.json();

    const assets = (data.assets || []).map((a) => ({
      name: a.name,
      url: a.browser_download_url,
    }));

    res.status(200).json({
      version: data.tag_name?.replace('v', '') || null,
      tag: data.tag_name || null,
      publishedAt: data.published_at || null,
      assets,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
