import 'dotenv/config';
import { google } from 'googleapis';
const auth = new google.auth.OAuth2(process.env.GSC_CLIENT_ID, process.env.GSC_CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: process.env.GSC_REFRESH_TOKEN });
try {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${await auth.getAccessToken()}` },
  });
  console.log(res.status, JSON.stringify(await res.json()));
} catch (e) {
  // userinfo scope not granted; fall back to listing GSC sites to prove access
  const sc = google.searchconsole({ version: 'v1', auth });
  const { data } = await sc.sites.list();
  console.log('userinfo unavailable; sites:', JSON.stringify((data.siteEntry || []).map(s => s.siteUrl)));
}
