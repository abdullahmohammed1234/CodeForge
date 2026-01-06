document.addEventListener('DOMContentLoaded', function() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    let currentContent = null;
    let isLoading = false;

    // Add sliding animation styles
    const style = document.createElement('style');
    style.textContent = `
        .content-area {
            position: relative;
            overflow: hidden;
        }

        #description {
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
        }

        .slide-in-right {
            transform: translateX(100%);
            opacity: 0;
        }

        .slide-in-left {
            transform: translateX(-100%);
            opacity: 0;
        }

        .slide-out-right {
            transform: translateX(-100%);
            opacity: 0;
        }

        .slide-out-left {
            transform: translateX(100%);
            opacity: 0;
        }

        .slide-active {
            transform: translateX(0);
            opacity: 1;
        }

        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
            font-size: 1.2em;
            color: #666;
        }

        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Function to show loading state
    function showLoading() {
        const contentArea = document.getElementById('description');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    Loading lesson...
                </div>
            `;
        }
    }

    // Function to load content dynamically
    async function loadContent(topic) {
        if (isLoading) return;
        isLoading = true;

        const [targetLang, ...rest] = topic.split('-');
        const fileName = rest.join('-') + '.html';

        // Determine the correct path
        const currentPath = window.location.pathname;
        const isInCurriculum = currentPath.includes('/curriculum/');

        let url;
        if (!isInCurriculum) {
            // From root pages (index.html, python-path.html)
            url = `curriculum/${targetLang}/${fileName}`;
        } else {
            // From inside /curriculum/cpp/ or /curriculum/python/
            const pathParts = currentPath.split('/');
            const currentLang = pathParts[pathParts.length - 2];
            if (targetLang === currentLang) {
                url = fileName;
            } else {
                url = `../${targetLang}/${fileName}`;
            }
        }

        try {
            showLoading();

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();

            // Parse the HTML and extract the content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract the description content
            const newContent = doc.getElementById('description');
            if (!newContent) {
                throw new Error('Content not found in loaded page');
            }

            // Update the page title
            const titleTag = doc.querySelector('title');
            if (titleTag) {
                document.title = titleTag.textContent;
            }

            // Animate content transition
            await animateContentTransition(newContent.innerHTML);

            // Update URL without page reload
            const newUrl = `/${url.replace('.html', '')}`;
            window.history.pushState({ topic }, '', newUrl);

        } catch (error) {
            console.error('Error loading content:', error);
            const contentArea = document.getElementById('description');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: #e74c3c;">
                        <h3>Error Loading Content</h3>
                        <p>Sorry, we couldn't load the lesson content. Please try again.</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        } finally {
            isLoading = false;
        }
    }

    // Function to animate content transitions
    async function animateContentTransition(newContent) {
        const contentArea = document.getElementById('description');
        if (!contentArea) return;

        // Add slide-out animation to current content
        contentArea.classList.add('slide-out-left');

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 150));

        // Update content
        contentArea.innerHTML = newContent;
        contentArea.classList.remove('slide-out-left');
        contentArea.classList.add('slide-in-right');

        // Wait a bit then complete animation
        await new Promise(resolve => setTimeout(resolve, 50));
        contentArea.classList.remove('slide-in-right');
        contentArea.classList.add('slide-active');

        // Re-initialize any interactive elements (like quizzes)
        initializeInteractiveElements();
    }

    // Function to initialize interactive elements after content load
    function initializeInteractiveElements() {
        // Re-initialize quiz functionality if present
        const quizForms = document.querySelectorAll('.quiz form');
        quizForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                // Add quiz evaluation logic here
                alert('Quiz submitted! (Evaluation logic would go here)');
            });
        });

        // Add smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Update sidebar click handlers
    sidebarItems.forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault(); // Prevent default link behavior

            const topic = this.getAttribute('data-topic');
            if (!topic) return;

            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Load content dynamically
            await loadContent(topic);
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.topic) {
            loadContent(event.state.topic);
        }
    });

    // Highlight active item based on current URL
    function highlightActiveItem() {
        const currentPath = window.location.pathname;

        if (currentPath.includes('/curriculum/')) {
            const pathParts = currentPath.split('/');
            const lang = pathParts[pathParts.length - 2];
            const topicName = pathParts[pathParts.length - 1] || 'intro';
            const topicId = `${lang}-${topicName}`;

            const activeItem = document.querySelector(`.sidebar li[data-topic="${topicId}"]`);
            if (activeItem) {
                // Remove active class from all items
                sidebarItems.forEach(i => i.classList.remove('active'));
                // Add active class to current item
                activeItem.classList.add('active');
            }
        }
    }

    // Initialize interactive elements on page load
    initializeInteractiveElements();

    // Highlight active item on page load
    highlightActiveItem();

    // Handle initial page load with hash-based navigation
    const urlParams = new URLSearchParams(window.location.search);
    const initialTopic = urlParams.get('topic');
    if (initialTopic) {
        loadContent(initialTopic);
    }
});