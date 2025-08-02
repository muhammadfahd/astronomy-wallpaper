document.addEventListener('DOMContentLoaded', () => {
    let isInfoVisible = false;
    const toggleButton = document.getElementById("toggle-info");
    const infoContainer = document.querySelector(".info-container");

    function initializeToggleButton() {
        if (toggleButton && infoContainer) {
            // Initial state
            toggleButton.textContent = '💡';
            toggleButton.style.display = 'flex';
            infoContainer.classList.remove('visible');

            toggleButton.addEventListener("click", () => {
                isInfoVisible = !isInfoVisible;
                infoContainer.classList.toggle("visible", isInfoVisible);
            });
        }
    }

    function updateBackground(data) {
        if (!data || !data.url) return;
        
        const container = document.getElementById("image-container");
        const img = new Image();
        
        img.onload = function() {
            container.style.backgroundImage = `url(${data.url})`;
            updateInfo(data);
        };
        
        img.onerror = function() {
            console.error("Failed to load image:", data.url);
            container.style.backgroundImage = `url('fallback.jpg')`;
        };
        
        img.src = data.url;
    }

    function updateInfo(data) {
        if (!data) return;
        
        const titleElement = document.getElementById("image-title");
        const descElement = document.getElementById("image-description");
        const dateElement = document.getElementById("image-date");

        if (titleElement && data.title) {
            titleElement.textContent = data.title;
            titleElement.style.display = 'block';
        }
        
        if (descElement && data.description) {
            descElement.textContent = data.description;
            descElement.style.display = 'block';
        }
        
        if (dateElement && data.date) {
            dateElement.textContent = new Date(data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateElement.style.display = 'block';
        }
    }

    // Load image and data
    chrome.storage.local.get("nasa_apod", (data) => { 
        if (data.nasa_apod) { 
            console.log("Loading image data from storage:", data.nasa_apod); 
            updateBackground(data.nasa_apod);
        } else { 
            console.log("NASA image not found in storage."); 
            chrome.runtime.sendMessage({ action: "fetchImage" });
        } 
    }); 

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "refreshData") {
            chrome.storage.local.get("nasa_apod", (data) => {
                if (data.nasa_apod) {
                    updateBackground(data.nasa_apod);
                }
            });
        }
    });

    // Initialize the toggle button
    initializeToggleButton();
});