const API_KEY = "API KEY HERE ";   
const API_URL = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`; 

// Function to check if we need to fetch new image
async function shouldFetchNewImage() {
    const data = await chrome.storage.local.get(['nasa_apod', 'lastFetchDate']);
    if (!data.lastFetchDate || !data.nasa_apod) return true;
    
    const lastFetch = new Date(data.lastFetchDate);
    const today = new Date();
    
    // Compare year, month, and day to determine if it's a new day
    return lastFetch.getFullYear() !== today.getFullYear() ||
           lastFetch.getMonth() !== today.getMonth() ||
           lastFetch.getDate() !== today.getDate();
}

async function fetchNASAImage() { 
    try { 
        // Add date parameter to get today's image
        const today = new Date().toISOString().split('T')[0];
        const urlWithDate = `${API_URL}&date=${today}`;
        
        const response = await fetch(urlWithDate); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); 
 
        if (data.media_type === "image" && data.url) { 
            const apodData = {
                url: data.url,
                title: data.title,
                description: data.explanation,
                date: data.date
            };
            
            console.log("Saving image data to storage:", apodData); 
            await chrome.storage.local.set({ 
                "nasa_apod": apodData,
                "lastFetchDate": new Date().toISOString()
            }); 
            
            // Notify any open tabs
            const tabs = await chrome.tabs.query({url: chrome.runtime.getURL("newtab.html")});
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { 
                    action: "updateImage", 
                    data: apodData 
                }).catch(() => console.log("Tab not ready for message"));
            });
        } 
    } catch (error) { 
        console.error("Error fetching NASA APOD:", error); 
    } 
} 

// Check for new image when opening a new tab
chrome.tabs.onCreated.addListener(async () => {
    const needsNewImage = await shouldFetchNewImage();
    if (needsNewImage) {
        await fetchNASAImage();
    }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    await fetchNASAImage();
});

// Handle incoming messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchImage") {
        fetchNASAImage();
    }
    return true;
});

// Daily check
chrome.alarms.create("fetchNASAImage", { periodInMinutes: 60 }); // Check every hour
chrome.alarms.onAlarm.addListener(async (alarm) => { 
    if (alarm.name === "fetchNASAImage") { 
        const needsNewImage = await shouldFetchNewImage();
        if (needsNewImage) {
            await fetchNASAImage();
        }
    } 
});
