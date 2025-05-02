function addLocationObserver(callback) {
    const config = { attributes: false, childList: true, subtree: false }
    const observer = new MutationObserver(callback)
    observer.observe(document.body, config)
}

async function observerCallback() {
    const location = window.location;
    const currentPath = location.protocol + '//' + location.host + location.pathname
    if (currentPath === 'https://github.com/' || 
        currentPath === 'https://github.com' || 
        (currentPath.includes("github.com/orgs") && currentPath.includes("/dashboard"))) {
        console.log("Adding GitHub PR table")
        await main()
    }
}

addLocationObserver(observerCallback)
if (!!window.chrome) {
    observerCallback()
}

async function main() {
    const urlParams = new URLSearchParams(window.location.search);
    const prParam = urlParams.get('prTable');

    await getDashboard(prParam);
}

async function getDashboard(prParam) {
    const dashboard = window.location.pathname.includes('/orgs') 
    ? document.querySelector('main')
    : document.querySelector('feed-container');
    if (!dashboard) return;
    const currentPrTable = dashboard.querySelector('#issues_dashboard');
    if (currentPrTable) return;

    let url = 'https://github.com/pulls';
    if (prParam) {
        switch (prParam) {
            case 'assigned': url = 'https://github.com/pulls/assigned'; break;
            case 'review-requested': url = 'https://github.com/pulls/review-requested'; break;
            case 'mentioned': url = 'https://github.com/pulls/mentioned'; break;
        }
    }
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html');
    const prTable = doc.getElementById('issues_dashboard');
    var br = document.createElement("br");
    prTable.append(br);

    const navBar = doc.querySelectorAll('.subnav-item')
    if (navBar) {
        navBar.forEach((item) => {
            const link = item.getAttribute('data-selected-links')
            let redirect = 'created';
            if (link) {
                if (link.includes('dashboard_assigned')) {
                    redirect = 'assigned'
                } else if (link.includes('dashboard_review_requested')) {
                    redirect = 'review-requested'
                } else if (link.includes('dashboard_mentioned')) {
                    redirect = 'mentioned'
                }

                item.setAttribute('href', 'https://github.com' + window.location.pathname + "?prTable=" + redirect);
            }
        })
    }

    dashboard.prepend(prTable);
}
