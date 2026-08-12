document.addEventListener('DOMContentLoaded', () => {

    // --- Local Dev URL Adapter ---
    // Live Server serves physical files and does not resolve extensionless routes like /training.
    // On localhost only, convert known extensionless page links to .html equivalents.
    const isLocalDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalDevHost) {
        const extensionlessPages = new Set([
            'available-dogs',
            'protection-dogs-for-sale',
            'blog',
            'elitk9-blog-los-angeles',
            'elitek9-blog-los-angeles',
            'elitek9-videos-los-angeles',
            'elitek9-social-media-los-angeles',
            'elitek9-our-passion-los-angeles',
            'elitek9-about-us-los-angeles',
            'blog-post-1',
            'bringing-puppy-home',
            'consultation',
            'dog-profile',
            'professional-k9-training-los-angeles',
            'communication-and-protection-dog-training-los-angeles',
            'foundation-communication-and-protection-dog-training-los-angeles',
            'professional-advanced-protection-dog-training-los-angeles',
            'future-breeding',
            'dog-breeding-los-angeles-ca',
            'nutrition-for-working-dogs',
            'protection-dogs-myth',
            'services',
            'protection-dog-services',
            'behavioral-modification-dog-training-los-angeles',
            'dog-obedience-training-los-angeles',
            'thank-you',
            'training',
            'protection-dog-training-los-angeles',
            'understanding-dog-body-language',
            'crate-training-adult-dog-dog-training-near-me',
            'golden-retriever-growth-stages',
            'dog-training-near-me-guide-2023',
            'professional-dog-training-near-me-service-dog-training',
            'dog-training-near-me-professional-dog-training-glendale',
            'boarding-dog-trainers-near-me-dog-training',
            'dog-training-commands-list-best-puppy-commands',
            'german-shepherd-boarding-training-near-me',
            'puppy-board-and-train-near-me-dog-training',
            'professional-dog-training-burbank',
            'professional-dog-training-service-dog-training',
            'how-to-catch-a-fake-service-dog-fraud-report',
            'professional-dog-training-west-hollywood',
            'how-to-get-service-dog-free-in-pa-arizona',
            'how-to-crate-train-an-adult-dog',
            'professional-dog-training-beverly-hills',
            'voice'
        ]);

        const rewriteForLocalDev = (href) => {
            if (!href) return href;
            if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
                return href;
            }

            const matched = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
            if (!matched) return href;

            const basePath = matched[1] || '';
            const query = matched[2] || '';
            const hash = matched[3] || '';

            if (!basePath || basePath === '/' || basePath.endsWith('/')) return href;

            const isAbsolute = /^https?:\/\//i.test(basePath);
            let pathPart = basePath;

            if (isAbsolute) {
                try {
                    const parsed = new URL(basePath);
                    // Only rewrite links that point to this project domain.
                    if (parsed.hostname !== 'elitek9group.com' && parsed.hostname !== window.location.hostname) {
                        return href;
                    }
                    pathPart = parsed.pathname;
                } catch (e) {
                    return href;
                }
            }

            const hasLeadingSlash = pathPart.startsWith('/');
            const normalized = hasLeadingSlash ? pathPart.slice(1) : pathPart;
            const lastSegment = normalized.split('/').pop() || '';

            if (!extensionlessPages.has(normalized)) return href;
            if (lastSegment.includes('.')) return href;

            const rewrittenPath = `${hasLeadingSlash ? '/' : ''}${normalized}.html`;
            return `${rewrittenPath}${query}${hash}`;
        };

        document.querySelectorAll('a[href]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            const rewritten = rewriteForLocalDev(href);
            if (rewritten !== href) {
                anchor.setAttribute('href', rewritten);
            }
        });
    }

    // --- Mobile Navigation ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links-new') || document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links-new a, .nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // --- Make service cards clickable (same target as their button link) ---
    const cardInteractiveSelector = 'a, button, input, textarea, select, label, summary';
    document.querySelectorAll('.service-card').forEach((card) => {
        const cardLink = card.querySelector('a[href]');
        if (!cardLink) return;

        card.classList.add('is-card-link');
        card.setAttribute('role', 'link');
        if (!card.hasAttribute('tabindex')) {
            card.setAttribute('tabindex', '0');
        }

        const goToCardLink = (event) => {
            if (!cardLink.href) return;

            const openInNewTab = event && (event.ctrlKey || event.metaKey || event.button === 1);
            if (openInNewTab) {
                window.open(cardLink.href, '_blank', 'noopener');
                return;
            }

            window.location.href = cardLink.href;
        };

        card.addEventListener('click', (event) => {
            if (event.target.closest(cardInteractiveSelector)) return;
            goToCardLink(event);
        });

        card.addEventListener('keydown', (event) => {
            if (event.target !== card) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            goToCardLink(event);
        });
    });

    // --- Blog Grid: show latest 6 cards, reveal the rest on demand ---
    const BLOG_VISIBLE_COUNT = 6;
    document.querySelectorAll('.blog-grid').forEach((blogGrid) => {
        const blogCards = Array.from(blogGrid.querySelectorAll('.blog-card'));
        if (blogCards.length <= BLOG_VISIBLE_COUNT) return;

        blogCards.slice(BLOG_VISIBLE_COUNT).forEach((card) => {
            card.style.display = 'none';
        });

        const showMoreWrap = document.createElement('div');
        showMoreWrap.style.textAlign = 'center';
        showMoreWrap.style.marginTop = '28px';
        showMoreWrap.style.marginBottom = '6px';

        const showMoreBtn = document.createElement('button');
        showMoreBtn.type = 'button';
        showMoreBtn.className = 'btn-primary btn-pulse-orange';
        showMoreBtn.textContent = 'Show More';
        showMoreBtn.style.padding = '14px 30px';
        showMoreBtn.style.border = 'none';
        showMoreBtn.style.cursor = 'pointer';

        showMoreBtn.addEventListener('click', () => {
            blogCards.slice(BLOG_VISIBLE_COUNT).forEach((card) => {
                card.style.display = '';
            });
            showMoreWrap.remove();
        });

        showMoreWrap.appendChild(showMoreBtn);
        blogGrid.insertAdjacentElement('afterend', showMoreWrap);
    });

    // --- Navbar Scroll Behavior ---
    const navbar = document.querySelector('.navbar-new');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });

            // Toggle current item
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Intersection Observer for Reveal Animations ---
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with .reveal class
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // Also keep legacy animation support if needed, or migrate elements to use .reveal
    const legacyAnimatedElements = document.querySelectorAll('.card, .about-text, .about-image, .video-card, .testimonial-card, .service-card, .dog-card');
    legacyAnimatedElements.forEach(el => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal', 'reveal-fade-up'); // Add new class dynamically only if not manually set
            revealObserver.observe(el);
        }
    });

    // Class for the visible state
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // --- New Hero Slider Logic ---
    const heroSlides = document.querySelectorAll('.hero-bg-slide');
    const heroNextBtn = document.querySelector('.hero-next');
    const heroPrevBtn = document.querySelector('.hero-prev');
    const heroDots = document.querySelectorAll('.hero-dot');
    let heroCurrentSlide = 0;
    const heroSlideInterval = 6000; // 6 seconds per slide
    let heroSlideTimer;
    let heroContentTimeout;

    // Hero content variations for each slide
    const heroContent = [
        {
            // Slide 3: Elite Dogs for Sale
            title: "ELITE PROTECTION DOGS<br>FOR SALE",
            description: "Don’t just get a dog—get peace of mind. Our elite protection dogs are trained, tested, and ready to guard your home and family from day one. Smart, loyal, and dependable—find your ultimate family protector in Los Angeles today.",
            ctaText: "FIND YOUR PROTECTOR",
            ctaLink: "protection-dogs-for-sale"
        },
        {
            // Slide 1: Aggression & Behavior Modification
            title: "TURN AGGRESSIVE<br>INTO CALM,<br>TRUSTED BEHAVIOR",
            description: "Tired of your dog's out-of-control behavior? Our trainers help dogs chill out, stop reacting, and become the reliable buddy you’ve always wanted. Let’s get your dog and your life back on track—start today!",
            ctaText: "GET SUPPORT TODAY",
            ctaLink: "protection-dog-training-los-angeles"
        },
        {
            // Slide 2: Family Protection & Obedience
            title: "BOARD & TRAIN<br>PROGRAMS",
            description: "Imagine a dog that’s calm, reliable, and always looking out for your family. Our in-home and intensive training programs help dogs build confidence, master obedience, and become the trusted companion every household needs. Start your journey to a safer, happier home today",
            ctaText: "Choose Training Program",
            ctaLink: "protection-dog-services"
        }

    ];

    if (heroSlides.length > 0) {
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroCta = document.getElementById('hero-cta');

        function updateHeroContent(index) {
            if (heroTitle && heroDesc && heroCta) {
                const content = heroContent[index];

                clearTimeout(heroContentTimeout);

                // Add fade-out effect
                heroTitle.style.opacity = '0';
                heroDesc.style.opacity = '0';
                heroCta.style.opacity = '0';

                heroContentTimeout = setTimeout(() => {
                    // Update content
                    heroTitle.innerHTML = content.title;
                    heroDesc.textContent = content.description;
                    heroCta.textContent = content.ctaText;
                    heroCta.href = content.ctaLink;

                    // Fade-in effect
                    heroTitle.style.opacity = '1';
                    heroDesc.style.opacity = '1';
                    heroCta.style.opacity = '1';
                }, 300);
            }
        }

        function goToHeroSlide(n) {
            heroSlides[heroCurrentSlide].classList.remove('active');
            heroDots[heroCurrentSlide].classList.remove('active');

            heroCurrentSlide = (n + heroSlides.length) % heroSlides.length;

            heroSlides[heroCurrentSlide].classList.add('active');
            heroDots[heroCurrentSlide].classList.add('active');

            // Update hero text content
            updateHeroContent(heroCurrentSlide);

            resetHeroTimer();
        }

        function nextHeroSlide() {
            goToHeroSlide(heroCurrentSlide + 1);
        }

        function prevHeroSlide() {
            goToHeroSlide(heroCurrentSlide - 1);
        }

        // Event Listeners
        if (heroNextBtn) heroNextBtn.addEventListener('click', nextHeroSlide);
        if (heroPrevBtn) heroPrevBtn.addEventListener('click', prevHeroSlide);

        // Dots Navigation
        heroDots.forEach((dot, index) => {
            dot.addEventListener('click', () => goToHeroSlide(index));
        });

        // Auto Play
        function startHeroTimer() {
            clearInterval(heroSlideTimer);
            heroSlideTimer = setInterval(nextHeroSlide, heroSlideInterval);
        }

        function resetHeroTimer() {
            startHeroTimer();
        }

        startHeroTimer();

        // Add CSS transitions for smooth text change
        if (heroTitle && heroDesc && heroCta) {
            heroTitle.style.transition = 'opacity 0.3s ease';
            heroDesc.style.transition = 'opacity 0.3s ease';
            heroCta.style.transition = 'opacity 0.3s ease';
        }

        // --- Touch / Swipe Support for Hero Slider ---
        const heroSlider = document.querySelector('.hero-slider-new');
        if (heroSlider) {
            let touchStartX = 0;
            let touchStartY = 0;
            let isSwiping = false;

            heroSlider.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isSwiping = false;
                clearInterval(heroSlideTimer);
            }, { passive: true });

            heroSlider.addEventListener('touchmove', (e) => {
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    isSwiping = true;
                    // If the target is a link or button, we might want to let it work, 
                    // but for a slider usually we preventDefault to prevent scrolling
                    if (e.cancelable) e.preventDefault();
                }
            }, { passive: false });

            heroSlider.addEventListener('touchend', (e) => {
                if (!isSwiping) {
                    resetHeroTimer();
                    return;
                }
                const deltaX = e.changedTouches[0].clientX - touchStartX;
                const swipeThreshold = Math.max(30, window.innerWidth * 0.10);
                if (deltaX < -swipeThreshold) {
                    nextHeroSlide(); // swipe left -> go forward
                } else if (deltaX > swipeThreshold) {
                    prevHeroSlide(); // swipe right -> go back
                }
                isSwiping = false;
                resetHeroTimer();
            }, { passive: true });
        }
    }

    // --- Enhanced Dog Animations ---
    // Add floating animation to the About Image
    const aboutImage = document.querySelector('.about-image img');
    if (aboutImage) {
        aboutImage.classList.add('animate-float');
    }

    // Add pulse effect to main CTA
    const mainCta = document.querySelector('.hero-slider .btn-primary');
    if (mainCta) {
        mainCta.classList.add('btn-pulse');
    }

    // --- Premium Testimonial Slider Logic ---
    const testTrack = document.querySelector('.testimonial-track');
    const testSlides = document.querySelectorAll('.testimonial-slide');
    const testPrev = document.querySelector('.test-btn.prev');
    const testNext = document.querySelector('.test-btn.next');
    const testDotsContainer = document.querySelector('.test-dots');

    if (testTrack && testSlides.length > 0) {
        let currentTestSlide = 0;
        const testCount = testSlides.length;

        // Create Dots
        testSlides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('test-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToTestSlide(index));
            testDotsContainer.appendChild(dot);
        });

        const testDots = document.querySelectorAll('.test-dot');

        function updateTestSlider() {
            // Move Track
            testTrack.style.transform = `translateX(-${currentTestSlide * 100}%)`;

            // Update Active Classes
            testSlides.forEach((slide, index) => {
                if (index === currentTestSlide) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });

            // Update Dots
            testDots.forEach((dot, index) => {
                if (index === currentTestSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        function goToTestSlide(n) {
            currentTestSlide = (n + testCount) % testCount;
            updateTestSlider();
            resetTestTimer();
        }

        function nextTestSlide() {
            goToTestSlide(currentTestSlide + 1);
        }

        function prevTestSlide() {
            goToTestSlide(currentTestSlide - 1);
        }

        // Event Listeners
        if (testNext) testNext.addEventListener('click', nextTestSlide);
        if (testPrev) testPrev.addEventListener('click', prevTestSlide);

        // Auto Play
        let testTimer;
        function startTestTimer() {
            testTimer = setInterval(nextTestSlide, 5000);
        }

        function resetTestTimer() {
            clearInterval(testTimer);
            startTestTimer();
        }

        startTestTimer();
    }
    // --- Featured Dogs Slider Logic ---
    const dogTrack = document.querySelector('.dog-slider-track');
    const dogContainer = document.querySelector('.dog-slider-container');
    const dogNext = document.querySelector('.next-dog');
    const dogPrev = document.querySelector('.prev-dog');

    let dogIndex = 0;
    // FIX #1: Declare early so event listeners can always access it
    let dogAutoScroll = null;

    const getSliderConfig = () => {
        if (!dogTrack || !dogContainer) return null;
        const items = dogTrack.querySelectorAll('.dog-slide-item');
        if (items.length === 0) return null;

        const firstItem = items[0];
        const gap = parseInt(window.getComputedStyle(dogTrack).gap) || 0;

        // For mobile/single view, use container width directly for precision
        const isMobile = window.innerWidth <= 768;
        const itemWidth = isMobile ? dogContainer.offsetWidth : (firstItem.getBoundingClientRect().width + gap);
        const visibleItems = isMobile ? 1 : Math.round(dogContainer.offsetWidth / itemWidth) || 1;

        return { itemWidth, visibleItems, totalItems: items.length };
    };

    if (dogTrack) {
        let config = getSliderConfig();

        window.addEventListener('resize', () => {
            config = getSliderConfig();
            if (config) {
                dogTrack.style.transition = 'none';
                dogTrack.style.transform = `translateX(${-dogIndex * config.itemWidth}px)`;
                setTimeout(() => dogTrack.style.transition = '', 50);
            }
        });

        const moveDogSlide = (direction) => {
            config = getSliderConfig();
            if (!config) return;

            const { itemWidth, visibleItems, totalItems } = config;

            if (direction === 'next') {
                dogIndex++;
                if (dogIndex > totalItems - visibleItems) {
                    dogIndex = 0;
                }
            } else {
                dogIndex--;
                if (dogIndex < 0) {
                    dogIndex = totalItems - visibleItems;
                }
            }

            dogTrack.style.transform = `translateX(${-dogIndex * itemWidth}px)`;
        };

        // FIX #2: Helper to start/restart auto-scroll cleanly (no duplicate intervals)
        const startDogAutoScroll = () => {
            clearInterval(dogAutoScroll);
            dogAutoScroll = setInterval(() => moveDogSlide('next'), 5000);
        };

        // FIX #3: Arrow clicks now restart auto-scroll after a brief pause
        if (dogNext) dogNext.addEventListener('click', () => {
            clearInterval(dogAutoScroll);
            moveDogSlide('next');
            startDogAutoScroll();
        });
        if (dogPrev) dogPrev.addEventListener('click', () => {
            clearInterval(dogAutoScroll);
            moveDogSlide('prev');
            startDogAutoScroll();
        });

        // FIX #4: mouseenter stops, mouseleave RESTARTS auto-scroll
        dogContainer.addEventListener('mouseenter', () => clearInterval(dogAutoScroll));
        dogContainer.addEventListener('mouseleave', () => startDogAutoScroll());

        // Start auto-scroll initially
        startDogAutoScroll();

        // --- Touch / Swipe Support for Dog Slider ---
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        dogContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
            clearInterval(dogAutoScroll);
        }, { passive: true });

        dogContainer.addEventListener('touchmove', (e) => {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                isSwiping = true;
                e.preventDefault();
            }
        }, { passive: false });

        dogContainer.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            // Dynamic threshold: 10% of screen width, min 30px — works on 320px phones
            const swipeThreshold = Math.max(30, window.innerWidth * 0.10);
            if (deltaX < -swipeThreshold) {
                moveDogSlide('next');
            } else if (deltaX > swipeThreshold) {
                moveDogSlide('prev');
            }
            isSwiping = false;
            // FIX: Restart auto-scroll cleanly (no duplicates)
            startDogAutoScroll();
        }, { passive: true });
    }


    // --- Trainer Avatars in Phone Modal ---
    const trainerAvatarByPhone = {
        "18183573797": "assets/images/Voskan-img-person-112.jpg",
        "18188028803": "assets/images/Simon-img-person-112.jpg"
    };
    const trainerAvatarByName = {
        "voskan": "assets/images/Voskan-img-person-112.jpg",
        "simon": "assets/images/Simon-img-person-112.jpg"
    };

    document.querySelectorAll('.trainer-call-btn').forEach((trainerBtn) => {
        if (trainerBtn.querySelector('.trainer-avatar')) return;

        const href = trainerBtn.getAttribute('href') || '';
        const digitsOnly = href.replace(/\D/g, '');
        const trainerInfo = trainerBtn.querySelector('.trainer-info');

        if (!trainerInfo) return;

        const trainerName = (trainerInfo.querySelector('.trainer-name')?.textContent || 'Trainer').trim();
        const avatarSrc = trainerAvatarByName[trainerName.toLowerCase()] || trainerAvatarByPhone[digitsOnly];

        if (!avatarSrc) return;

        const avatarImg = document.createElement('img');
        avatarImg.className = 'trainer-avatar';
        avatarImg.src = avatarSrc;
        avatarImg.alt = `${trainerName} avatar`;
        avatarImg.loading = 'lazy';
        avatarImg.decoding = 'async';
        avatarImg.width = 56;
        avatarImg.height = 56;

        trainerBtn.insertBefore(avatarImg, trainerInfo);
    });

    // --- Deferred Video Source Loading ---
    // Load heavy videos only when they approach viewport to reduce initial page weight.
    const deferredVideos = Array.from(document.querySelectorAll('video[data-src]'));
    if (deferredVideos.length > 0) {
        const activateVideoSource = (videoEl) => {
            const source = videoEl.getAttribute('data-src');
            if (!source) return;

            videoEl.setAttribute('src', source);
            videoEl.removeAttribute('data-src');
            videoEl.load();

            if (videoEl.hasAttribute('autoplay')) {
                const playPromise = videoEl.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => { });
                }
            }
        };

        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    activateVideoSource(entry.target);
                    observer.unobserve(entry.target);
                });
            }, {
                root: null,
                rootMargin: '300px 0px',
                threshold: 0.01
            });

            deferredVideos.forEach((videoEl) => videoObserver.observe(videoEl));
        } else {
            deferredVideos.forEach((videoEl) => activateVideoSource(videoEl));
        }
    }
    // --- Phone Modal Toggle ---
    const phoneBtn = document.getElementById('floatPhoneBtn');
    const phoneModal = document.getElementById('phoneModal');
    const closeModal = document.querySelector('.close-modal');

    if (phoneBtn && phoneModal) {
        phoneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            phoneModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                phoneModal.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            });
        }

        // Close on clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === phoneModal) {
                phoneModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // --- Breeding Manager Contact Button Modal ---
    const breedingContactBtn = document.getElementById('breedingContactBtn');
    if (breedingContactBtn && phoneModal) {
        breedingContactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            phoneModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // --- Dog Profile Inquiry Button Modal ---
    const inquiryBtn = document.getElementById('inquiryBtn');
    if (inquiryBtn && phoneModal) {
        inquiryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            phoneModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    // --- Reliable Contact Deep-Link Fallback ---
    // Some mobile in-app browsers can ignore the initial hash scroll.
    const applyGetInTouchDeepLink = () => {
        const hash = (window.location.hash || '').toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const sectionParam = (params.get('section') || '').toLowerCase();
        const shouldScroll = hash === '#get-in-touch' || sectionParam === 'get-in-touch' || sectionParam === 'contact';

        if (!shouldScroll) return;

        const target = document.getElementById('get-in-touch') || document.getElementById('contact');
        if (!target) return;

        const offset = window.innerWidth <= 768 ? 88 : 110;
        const scrollToTarget = () => {
            const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' });
        };

        // Run multiple times to survive late layout shifts (fonts/images).
        scrollToTarget();
        setTimeout(scrollToTarget, 160);
        setTimeout(scrollToTarget, 700);
    };

    applyGetInTouchDeepLink();
    window.addEventListener('load', applyGetInTouchDeepLink);
    window.addEventListener('hashchange', applyGetInTouchDeepLink);
});







