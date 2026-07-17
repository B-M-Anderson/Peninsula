/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.bennettanderson.com',
  generateRobotsTxt: true, // optional
  sitemapSize: 5000, // max URLs per sitemap
  // keep the hidden vault page out of the sitemap — it's meant to be found, not indexed
  // (api routes aren't pages either)
  exclude: ['/vault', '/darkroom', '/api/*'],
}
