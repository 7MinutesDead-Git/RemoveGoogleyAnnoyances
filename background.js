// Since injected functions with chrome content scripts are a copy, not a reference,
// trying to access any functions or variables out of this scope wouldn't work.
// So everything will go inside removeGoogleAdSection().
async function removeGoogleAdSection() {
    const pollrate = 100
    let waited = 0

    // --------------------------------------------------------------
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // The divs generated as ads in google searches seem to reside in a parent div,
    // which contains a child script tag with a data attribute pointing to google ad services url.
    // For example:
    // <div block with ads>
    //    <div ad result 1/>
    //    <div ad result 2/>
    //    <script data-u="https://www.googleadservices.com/">
    // </div>
    const scriptsToCheck = document.querySelectorAll('script[data-u]')

    try {
        if (scriptsToCheck) {
            for (const script of scriptsToCheck) {
                if (script.getAttribute('data-u').includes('googleadservices')) {
                    console.log('🐠 Found google ad script node, removing divs... 🐠')
                    script.parentNode.remove()
                    console.log('🐠 Ads removed 🐠')
                }
            }
        }
        else {
            console.log("🐠 Didn't see any ads. Nice. 🐠")
        }
    }
    catch (err) {
        console.error("🐠 Caught this error from Remove G Annoyance Results: ", err)
    }
}

// Injects removeGoogleAdSection into targetted tab.
async function injectScript(tab) {
    return await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: removeGoogleAdSection,
        args: [],
    });
}

// -------------------------------------------------------------
// Covers active tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        console.log(`tab: ${tab.id}`, tab)
        await injectScript(tab)
    }
})

// -------------------------------------------------------------
// Covers newly created tabs that aren't in focus.
chrome.tabs.onCreated.addListener(async (tab) => {
    console.log(`new tab: ${tab.id}`, tab)
    await injectScript(tab)
})