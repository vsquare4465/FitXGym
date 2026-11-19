// Called only after a verified backup has been successfully uploaded.
const repo = process.env.GITHUB_REPOSITORY;
if (repo !== 'vsquare4465/FitXGym-backups') throw new Error('Refusing retention outside the private backup repository.');
const headers = { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' };
async function api(endpoint, method = 'GET') {
  const r = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, { method, headers, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Backup retention API returned HTTP ${r.status}.`);
  return r.status === 204 ? null : r.json();
}
const artifacts = [];
for (let page = 1; ; page++) {
  const data = await api(`/actions/artifacts?per_page=100&page=${page}`);
  artifacts.push(...data.artifacts.filter(a => /^fitx-backup-\d+-\d+$/.test(a.name) && !a.expired));
  if (data.artifacts.length < 100) break;
}
artifacts.sort((a, b) => b.id - a.id);
for (const old of artifacts.slice(8)) await api(`/actions/artifacts/${old.id}`, 'DELETE');
console.log(`Retention complete: ${Math.min(8, artifacts.length)} encrypted backups retained (maximum 56 days).`);
