// ============================================
// BACKGROUND ANIMATION
// ============================================
const canvas = document.getElementById('pixelCanvas');
const html = document.documentElement;

if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 1
        });
    }

    function drawStars() {
        const isDark = !html.hasAttribute('data-theme') || html.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? '#fff' : '#000';
        
        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function animate() {
        const isDark = !html.hasAttribute('data-theme') || html.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? '#0d1117' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawStars();
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============================================
// HAMBURGER MENU
// ============================================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// ============================================
// THEME SWITCHER WITH DEVICE DETECTION
// ============================================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');
const themes = ['dark', 'light', 'system'];
let currentThemeIndex = 0;

// Detect device type
function getDeviceType() {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check if mobile or tablet
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
    
    if (isMobile && !isTablet) {
        return '📱'; // Mobile phone
    } else if (isTablet) {
        return '📱'; // Tablet (using same icon)
    } else {
        return '💻'; // Desktop/Laptop
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentThemeIndex = themes.indexOf(savedTheme);
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'system') {
        html.removeAttribute('data-theme');
        themeIcon.textContent = getDeviceType(); // Dynamic device icon
    } else if (theme === 'light') {
        html.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
}

if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const newTheme = themes[currentThemeIndex];
        applyTheme(newTheme);
        
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 300);
    });
}

loadTheme();

// Update icon on window resize (in case device orientation changes)
window.addEventListener('resize', function() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'system') {
        themeIcon.textContent = getDeviceType();
    }
});

// ============================================
// AI CHATBOT - SMART WEBSITE ASSISTANT
// ============================================

const chatTerminalBtn = document.getElementById('gameTerminalBtn');
const chatTerminal = document.getElementById('gameTerminal');
const terminalCloseBtn = document.getElementById('terminalCloseBtn');
const terminalInput = document.getElementById('terminalInput');
const terminalHistory = document.getElementById('terminalHistory');

let websiteContent = null;
let conversationHistory = [];

// ============================================
// SCRAPE WEBSITE CONTENT DYNAMICALLY
// ============================================
function scrapeWebsiteContent() {
    const content = {
        siteName: '',
        navigation: [],
        currentPage: '',
        mainContent: '',
        skills: [],
        projects: [],
        about: '',
        contact: {},
        allText: ''
    };

    // Get site name
    const logo = document.querySelector('.logo');
    if (logo) {
        content.siteName = logo.textContent.trim();
    }

    // Get navigation links
    const navLinksElements = document.querySelectorAll('.nav-links a');
    navLinksElements.forEach(link => {
        content.navigation.push({
            text: link.textContent.trim(),
            href: link.getAttribute('href'),
            isActive: link.classList.contains('active')
        });
    });

    // Get current page
    content.currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Get hero section
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const name = heroContent.querySelector('.name')?.textContent || '';
        const title = heroContent.querySelector('.title')?.textContent || '';
        const subtitle = heroContent.querySelector('.hero-subtitle')?.textContent || '';
        content.hero = `${name} ${title}. ${subtitle}`;
    }

    // Get main content
    const mainElement = document.querySelector('main');
    if (mainElement) {
        content.mainContent = mainElement.textContent.trim();
    }

    // Get section title and subtitle
    const sectionTitle = document.querySelector('.section-title');
    const sectionSubtitle = document.querySelector('.section-subtitle');
    if (sectionTitle) {
        content.sectionTitle = sectionTitle.textContent.trim();
    }
    if (sectionSubtitle) {
        content.sectionSubtitle = sectionSubtitle.textContent.trim();
    }

    // Scrape skills
    const skillCategories = document.querySelectorAll('.skill-category');
    skillCategories.forEach(category => {
        const categoryName = category.querySelector('h3')?.textContent || '';
        const skills = Array.from(category.querySelectorAll('.skill-item')).map(s => s.textContent.trim());
        
        if (categoryName && skills.length > 0) {
            content.skills.push({
                category: categoryName,
                items: skills
            });
        }
    });

    // Scrape projects
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent || '';
        const description = card.querySelector('p')?.textContent || '';
        const tech = Array.from(card.querySelectorAll('.project-tech span')).map(t => t.textContent.trim());
        
        if (title) {
            content.projects.push({
                title,
                description,
                technologies: tech
            });
        }
    });

    // Scrape about section
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        const heading = aboutText.querySelector('h2')?.textContent || '';
        const paragraphs = Array.from(aboutText.querySelectorAll('p')).map(p => p.textContent.trim());
        const lists = Array.from(aboutText.querySelectorAll('.about-list li')).map(li => li.textContent.trim());
        
        content.about = `${heading}\n${paragraphs.join('\n')}\n${lists.join('\n')}`;
    }

    // Scrape stats
    const statCards = document.querySelectorAll('.stat-card');
    const stats = [];
    statCards.forEach(card => {
        const number = card.querySelector('.stat-number')?.textContent || '';
        const label = card.querySelector('.stat-label')?.textContent || '';
        if (number && label) {
            stats.push(`${number} ${label}`);
        }
    });
    if (stats.length > 0) {
        content.stats = stats.join(', ');
    }

    // Scrape contact info
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const label = item.querySelector('strong')?.textContent || '';
        const value = item.querySelector('p')?.textContent || item.textContent.replace(label, '').trim();
        if (label) {
            content.contact[label.toLowerCase().replace(':', '')] = value;
        }
    });

    // Get footer info
    const footer = document.querySelector('footer');
    if (footer) {
        content.footer = footer.textContent.trim();
    }

    return content;
}

// ============================================
// SMART RESPONSE GENERATOR (NO API NEEDED!)
// ============================================
function generateSmartResponse(userMessage) {
    if (!websiteContent) {
        websiteContent = scrapeWebsiteContent();
    }

    const lowerMessage = userMessage.toLowerCase();

    // GAME COMMAND - Launch the game!
    if (lowerMessage === 'play game' || lowerMessage === 'game' || lowerMessage === 'start game') {
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1000);
        return "🚀 Launching Space Shooter Game...\n3... 2... 1... BLAST OFF! 🎮";
    }

    // Skills questions
    if (lowerMessage.includes('skill') || lowerMessage.includes('tech') || lowerMessage.includes('tool')) {
        if (websiteContent.skills.length > 0) {
            let response = "Here are the skills on this portfolio:\n\n";
            websiteContent.skills.forEach(skillGroup => {
                response += `📌 ${skillGroup.category}:\n`;
                response += skillGroup.items.join(', ') + '\n\n';
            });
            return response;
        }
        return "I can see this portfolio showcases various technical skills. Check out the Skills page for details!";
    }

    // Projects questions
    if (lowerMessage.includes('project') || lowerMessage.includes('work') || lowerMessage.includes('built') || lowerMessage.includes('portfolio')) {
        if (websiteContent.projects.length > 0) {
            let response = "Here are the featured projects:\n\n";
            websiteContent.projects.forEach((project, index) => {
                response += `${index + 1}. ${project.title}\n`;
                response += `   ${project.description}\n`;
                if (project.technologies.length > 0) {
                    response += `   Tech: ${project.technologies.join(', ')}\n`;
                }
                response += '\n';
            });
            return response;
        }
        return "This portfolio features several interesting projects. Visit the Projects page to see them all!";
    }

    // About questions
    if (lowerMessage.includes('about') || lowerMessage.includes('who') || lowerMessage.includes('experience')) {
        if (websiteContent.about) {
            return websiteContent.about;
        }
        if (websiteContent.hero) {
            return websiteContent.hero + "\n\nVisit the About page to learn more!";
        }
        return "This is a developer portfolio website. Check out the About page for more information!";
    }

    // Contact questions
    if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('reach') || lowerMessage.includes('phone')) {
        if (Object.keys(websiteContent.contact).length > 0) {
            let response = "Contact Information:\n\n";
            Object.entries(websiteContent.contact).forEach(([key, value]) => {
                response += `${key}: ${value}\n`;
            });
            return response;
        }
        return "Visit the Contact page to get in touch!";
    }

    // Navigation questions
    if (lowerMessage.includes('page') || lowerMessage.includes('section') || lowerMessage.includes('navigate')) {
        let response = "Available pages:\n\n";
        websiteContent.navigation.forEach(nav => {
            response += `• ${nav.text} - ${nav.href}\n`;
        });
        return response;
    }

    // Stats questions
    if (lowerMessage.includes('stat') || lowerMessage.includes('achievement')) {
        if (websiteContent.stats) {
            return `Achievements:\n${websiteContent.stats}`;
        }
    }

    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! 👋 I'm your portfolio assistant. I can help you learn about:\n• Skills and technologies\n• Projects and work\n• Contact information\n• Play the space shooter game (type 'play game')\n\nWhat would you like to know?";
    }

    // Help
    if (lowerMessage.includes('help')) {
        return "I can help you with:\n\n• 'What skills do you have?' - View skills\n• 'Tell me about your projects' - See projects\n• 'How can I contact you?' - Get contact info\n• 'Tell me about yourself' - Learn more\n• 'play game' - Launch space shooter! 🚀\n• 'clear' - Clear the chat";
    }

    // Default response with context
    return `I'm your portfolio assistant! I can tell you about:\n\n• Skills & Technologies\n• Projects & Work\n• Experience & Background\n• Contact Information\n• Play the Space Shooter game! (type 'play game') 🎮\n\nTry asking: "What skills do you have?" or "Tell me about your projects!"`;
}

// ============================================
// ADD MESSAGE TO TERMINAL
// ============================================
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `terminal-line ${type}`;
    
    if (type === 'user') {
        messageDiv.innerHTML = `<span class="prompt">$</span> ${escapeHtml(content)}`;
    } else if (type === 'assistant') {
        const formattedContent = escapeHtml(content).replace(/\n/g, '<br>');
        messageDiv.innerHTML = `🤖 ${formattedContent}`;
    } else if (type === 'system') {
        messageDiv.innerHTML = `${content}`;
    } else if (type === 'error') {
        messageDiv.innerHTML = `${content}`;
    }
    
    terminalHistory.appendChild(messageDiv);
    scrollToBottom();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const terminalBody = document.querySelector('.terminal-body');
    if (terminalBody) {
        setTimeout(() => {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 100);
    }
}

// ============================================
// OPEN/CLOSE TERMINAL
// ============================================
if (chatTerminalBtn && chatTerminal) {
    chatTerminalBtn.addEventListener('click', function() {
        chatTerminal.classList.add('active');
        
        if (!websiteContent) {
            websiteContent = scrapeWebsiteContent();
            console.log('Website content scraped:', websiteContent);
        }
        
        setTimeout(function() {
            if (terminalInput) {
                terminalInput.focus();
            }
        }, 300);
    });
}

if (terminalCloseBtn && chatTerminal) {
    terminalCloseBtn.addEventListener('click', function() {
        chatTerminal.classList.remove('active');
    });
}

// ============================================
// HANDLE TERMINAL INPUT
// ============================================
if (terminalInput && terminalHistory) {
    terminalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const userMessage = terminalInput.value.trim();
            
            if (userMessage === '') {
                return;
            }
            
            addMessage('user', userMessage);
            terminalInput.value = '';
            
            if (userMessage.toLowerCase() === 'clear') {
                terminalHistory.innerHTML = '<p class="terminal-line system">🤖 Terminal cleared. How can I help you?</p>';
                conversationHistory = [];
                return;
            }
            
            // Generate response
            setTimeout(() => {
                const response = generateSmartResponse(userMessage);
                addMessage('assistant', response);
                
                conversationHistory.push({
                    user: userMessage,
                    assistant: response
                });
            }, 500);
        }
    });

    if (chatTerminal) {
        chatTerminal.addEventListener('click', function(e) {
            if (!e.target.classList.contains('terminal-close-btn')) {
                terminalInput.focus();
            }
        });
    }
}

// ============================================
// CONTACT FORM
// ============================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(function() {
            submitBtn.textContent = 'Message Sent! ✓';
            submitBtn.style.background = '#7ee787';
            
            setTimeout(function() {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
                contactForm.reset();
            }, 3000);
        }, 2000);
    });
}

// ============================================
// SCROLL EFFECTS
// ============================================
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (canvas) {
        canvas.style.transform = 'translateY(' + (scrollTop * 0.3) + 'px)';
    }
});

// ============================================
// CONSOLE MESSAGE
// ============================================
console.log('%c🤖 AI Assistant Ready!', 'font-size: 20px; color: #7ee787; font-weight: bold;');
console.log('%cClick the chat icon to start a conversation!', 'font-size: 14px; color: #58a6ff;');
console.log('%cType "play game" to launch the space shooter! 🚀', 'font-size: 12px; color: #bc8cff;');