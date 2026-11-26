// Keep dashboard links from earlier versions usable on the new Studio entry page.
const dashboardSections = new Set(['home','agents','services','connections','logs','checks','help','settings']);
function openDashboardLink() {
  if (dashboardSections.has(location.hash.slice(1))) location.replace('operasional/' + location.hash);
}
openDashboardLink();
window.addEventListener('hashchange', openDashboardLink);
