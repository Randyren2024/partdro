// DB final check: brand remnants + content integrity
const URL = 'https://gcsshuvfzuinevacraao.supabase.co/rest/v1'
const KEY = 'sb_publishable_TUa2RdDSopaXX8d_7MiGkw_x5FwLfAP'
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const posts = await (await fetch(`${URL}/posts?select=id,slug,image_url&order=id.asc`, { headers })).json()
const langs = await (await fetch(`${URL}/post_langs?select=post_id,lang,title,summary,content`, { headers })).json()

const badPosts = posts.filter(p => /topxgun/i.test(p.slug + p.image_url))
const badLangs = langs.filter(l => /topxgun/i.test(l.title + l.summary + (l.content || '')))
const badDomain = langs.filter(l => /partdroag\.com|doubaocdn/i.test((l.content || '') + l.summary))
const thin = langs.filter(l => !l.content || l.content.length < 500)
const noHero = posts.filter(p => !p.image_url.startsWith('/images/blog/'))

console.log('posts:', posts.length, '| langs:', langs.length)
console.log('posts w/ topxgun slug/img:', badPosts.length)
console.log('langs w/ topxgun text:', badLangs.length)
console.log('langs w/ dead domain:', badDomain.length)
console.log('thin content (<500):', thin.length)
console.log('posts w/ non-local hero:', noHero.length)
const sample = langs[0]
console.log('sample:', sample.title, '| content len:', (sample.content || '').length)
const withImgs = langs.filter(l => (l.content || '').includes('<img'))
const remoteImgs = langs.filter(l => /<img[^>]+src="https?:\/\/(?!localhost)/i.test(l.content || ''))
console.log('langs w/ content imgs:', withImgs.length, '| w/ remote img src:', remoteImgs.length)
