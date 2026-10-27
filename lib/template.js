function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
    return escapeHtml(str);
}

function slugify(title) {
    return String(title)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function inlineFormat(escapedText) {
    // [link text](https://example.com) -> <a>. Safe here because escapeHtml()
    // already ran and doesn't touch [ ] ( ), and the captured pieces are
    // already-escaped text, so they're safe to drop straight into the tag.
    let out = escapedText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Bold is consumed above first, so every remaining "*" pair here is a
    // genuine single-asterisk italic marker, not half of a "**bold**" one.
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return out;
}

const BULLET_RE = /^[-*]\s+(.*)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/;
const HEADING_RE = /^(#{2,4})\s+(.*)$/;

// Plain text (already meant for display, not yet HTML) -> safe HTML.
// Works line by line so it survives pasted text that lost its blank lines
// (common when pasting from a chat window or doc into a <textarea> -- only
// the single \n's survive). Each line is its own paragraph UNLESS it's part
// of a run of consecutive bullet lines ("- " or "* ") or numbered lines
// ("1. "), which get grouped into one <ul>/<ol>. A line starting with
// ## / ### / #### is a subheading (h2/h3/h4). A genuinely blank line is just
// a gap between lines and changes nothing beyond ending whatever run was
// in progress. **text** becomes bold, [text](https://url) becomes a link.
// Google Docs' own "Download as Markdown" export backslash-escapes
// punctuation it thinks could be misread as markdown (most visibly "1\."
// in a bolded heading like "### **1\. Step One**") -- unescape those before
// anything else runs, so a literal backslash never leaks into the output.
function unescapeMarkdownPunctuation(line) {
    return line.replace(/\\([.*_\-[\]()#\\])/g, '$1');
}

function bodyTextToHtml(rawText) {
    const text = String(rawText || '').replace(/\r\n/g, '\n').trim();
    if (!text) return '';
    const lines = text.split('\n').map((l) => unescapeMarkdownPunctuation(l.trim()));

    const htmlBlocks = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line) { i += 1; continue; }

        const heading = HEADING_RE.exec(line);
        if (heading) {
            const level = Math.min(heading[1].length, 4); // ## -> h2 .. #### -> h4
            htmlBlocks.push(`<h${level}>${inlineFormat(escapeHtml(heading[2]))}</h${level}>`);
            i += 1;
            continue;
        }

        if (BULLET_RE.test(line)) {
            const items = [];
            while (i < lines.length && BULLET_RE.test(lines[i])) {
                items.push(`<li>${inlineFormat(escapeHtml(BULLET_RE.exec(lines[i])[1]))}</li>`);
                i += 1;
            }
            htmlBlocks.push(`<ul>\n                ${items.join('\n                ')}\n            </ul>`);
            continue;
        }

        if (NUMBERED_RE.test(line)) {
            const items = [];
            while (i < lines.length && NUMBERED_RE.test(lines[i])) {
                items.push(`<li>${inlineFormat(escapeHtml(NUMBERED_RE.exec(lines[i])[1]))}</li>`);
                i += 1;
            }
            htmlBlocks.push(`<ol>\n                ${items.join('\n                ')}\n            </ol>`);
            continue;
        }

        htmlBlocks.push(`<p>${inlineFormat(escapeHtml(line))}</p>`);
        i += 1;
    }

    return htmlBlocks.join('\n\n            ');
}

function renderPostHtml({ title, metaTitle, slug, description, category, imageSrc, imageAlt, bodyHtml, dateIso }) {
    const t = escapeHtml(title);
    // The template appends " | Elite K9 Group" itself below -- strip it if the
    // admin already typed it in the meta title field, so it doesn't double up.
    const metaTitleBase = (metaTitle || title).replace(/\s*\|\s*Elite K9 Group\s*$/i, '');
    const mt = escapeHtml(metaTitleBase);
    const d = escapeAttr(description);
    const cat = escapeHtml(category);
    const img = escapeAttr(imageSrc);
    const imgAlt = escapeAttr(imageAlt);
    const url = `https://elitek9group.com/${slug}`;

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-PWPGRQ97');</script>
    <!-- End Google Tag Manager -->

<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mt} | Elite K9 Group</title>
    <meta name="description" content="${d}">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></noscript>
        <link rel="canonical" href="${url}" />
<link rel="icon" type="image/png" href="favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="shortcut icon" href="favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />
    <link rel="manifest" href="site.webmanifest" />
    <style>
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #333;
            text-decoration: none;
            font-weight: 600;
        }

        .back-link:hover {
            color: #128C7E;
        }

        .single-blog-post {
            max-width: 800px;
            margin: 0 auto;
        }

        .blog-text-content {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #444;
        }

        .blog-text-content p {
            margin-bottom: 20px;
        }

        .blog-text-content ul,
        .blog-text-content ol {
            margin-bottom: 20px;
            padding-left: 22px;
        }

        .blog-text-content li {
            margin-bottom: 10px;
        }

        .blog-text-content strong {
            color: #222;
        }

        .blog-text-content a {
            color: #128C7E;
            text-decoration: underline;
        }

        .blog-text-content a:hover {
            color: #0d6b60;
        }

        .blog-text-content h2,
        .blog-text-content h3,
        .blog-text-content h4 {
            color: #222;
            line-height: 1.3;
            margin: 32px 0 14px;
        }

        .blog-text-content h2 { font-size: 1.5rem; }
        .blog-text-content h3 { font-size: 1.3rem; }
        .blog-text-content h4 { font-size: 1.15rem; }

        .page-header {
            margin-bottom: 12px;
        }

        .container.section-padding {
            padding-top: 24px;
        }
    </style>
            <meta property="og:title" content="${mt} | Elite K9 Group" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="https://elitek9group.com/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${mt} | Elite K9 Group" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="https://elitek9group.com/og-image.jpg" />
    <script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": "https://elitek9group.com/#organization",
            "name": "Elite K9 Group",
            "url": "https://elitek9group.com/",
            "logo": { "@type": "ImageObject", "url": "https://elitek9group.com/apple-touch-icon.png" },
            "sameAs": ["https://www.instagram.com/elite_k9_group/"],
            "contactPoint": [
                { "@type": "ContactPoint", "telephone": "+1-818-357-3797", "contactType": "customer service", "areaServed": "US", "availableLanguage": ["en"] },
                { "@type": "ContactPoint", "telephone": "+1-818-802-8803", "contactType": "customer service", "areaServed": "US", "availableLanguage": ["en"] }
            ]
        },
        {
            "@type": "LocalBusiness",
            "@id": "https://elitek9group.com/#localbusiness",
            "name": "Elite K9 Group",
            "url": "https://elitek9group.com/",
            "image": "https://elitek9group.com/og-image.jpg",
            "telephone": "+1-818-357-3797",
            "priceRange": "$$",
            "address": { "@type": "PostalAddress", "streetAddress": "13238 Riverside Dr", "addressLocality": "Sherman Oaks", "addressRegion": "CA", "postalCode": "91423", "addressCountry": "US" },
            "areaServed": "Los Angeles County",
            "parentOrganization": { "@id": "https://elitek9group.com/#organization" }
        },
        {
            "@type": "WebSite",
            "@id": "https://elitek9group.com/#website",
            "url": "https://elitek9group.com/",
            "name": "Elite K9 Group",
            "publisher": { "@id": "https://elitek9group.com/#organization" },
            "inLanguage": "en-US"
        },
        {
            "@type": "WebPage",
            "@id": "${url}",
            "url": "${url}",
            "name": "${mt} | Elite K9 Group",
            "description": "${d}",
            "isPartOf": { "@id": "https://elitek9group.com/#website" },
            "about": { "@id": "https://elitek9group.com/#localbusiness" },
            "inLanguage": "en-US"
        },
        {
            "@type": "BreadcrumbList",
            "@id": "${url}#breadcrumb",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://elitek9group.com/" },
                { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://elitek9group.com/elitek9-blog-los-angeles" },
                { "@type": "ListItem", "position": 3, "name": "${t}", "item": "${url}" }
            ]
        },
        {
            "@type": "Article",
            "@id": "${url}#article",
            "mainEntityOfPage": { "@id": "${url}" },
            "headline": "${t}",
            "description": "${d}",
            "author": { "@id": "https://elitek9group.com/#organization" },
            "publisher": { "@id": "https://elitek9group.com/#organization" },
            "datePublished": "${dateIso}",
            "dateModified": "${dateIso}",
            "inLanguage": "en-US",
            "isPartOf": { "@id": "https://elitek9group.com/elitek9-blog-los-angeles" }
        }
    ]
}
    </script>
</head>

<body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PWPGRQ97" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

<!-- Navigation -->
    <nav class="navbar-new">
        <div class="container navbar-container">
            <a href="/" class="logo-new">
                <img src="assets/images/logo-k9-new-v02.png" alt="Elite K9 Group Logo" class="logo-image" loading="eager" fetchpriority="high" decoding="async" width="300" height="85">
            </a>
            <ul class="nav-links-new">
                <li><a href="/">Home</a></li>
                <li class="has-dropdown"><a href="protection-dog-training-los-angeles">Training</a></li>
                <li class="has-dropdown"><a href="protection-dog-services">Services</a></li>
                <li class="has-dropdown"><a href="protection-dogs-for-sale">Dogs For Sale</a></li>
                <li><a href="dog-breeding-los-angeles-ca">Future Breeding</a></li>
                <li><a href="elitek9-blog-los-angeles" class="active">Blogs</a></li>
                <li class="mobile-menu-footer">
                    <div class="navbar-phone-wrapper">
                        <a href="tel:+18183573797" class="phone-number-nav">
                            <i class="fas fa-phone-alt"></i>
                            818-357-3797 <span>Voskan</span>
                        </a>
                        <a href="tel:+18188028803" class="phone-number-nav">
                            <i class="fas fa-phone-alt"></i>
                            818-802-8803 <span>Simon</span>
                        </a>
                    </div>
                    <a href="consultation" class="btn-primary btn-pulse-orange btn-nav-cta">
                        Book a Free Consult
                    </a>
                </li>
            </ul>
            <div class="navbar-right">
                <a href="consultation" class="btn-primary btn-pulse-orange btn-nav-cta">
                    Book a Free Consult
                </a>

                <div class="social-icons-nav">
                    <a href="https://www.instagram.com/elite_k9_group/" target="_blank" aria-label="Instagram"><i
                            class="fab fa-instagram"></i></a>
                    <a href="https://www.facebook.com/andyspetgroomingdaycare/" target="_blank" aria-label="Facebook"><i
                            class="fab fa-facebook-f"></i></a>
                </div>
                <div class="navbar-phone-wrapper">
                    <a href="tel:+18183573797" class="phone-number-nav">
                        <i class="fas fa-phone-alt"></i>
                        818-357-3797 <span>Voskan</span>
                    </a>
                    <a href="tel:+18188028803" class="phone-number-nav">
                        <i class="fas fa-phone-alt"></i>
                        818-802-8803 <span>Simon</span>
                    </a>
                </div>
            </div>
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <header class="page-header text-center">
        <div class="container">
            <h1>${t}</h1>
            <p>${cat}</p>
        </div>
    </header>

    <div class="container section-padding">
        <a href="elitek9-blog-los-angeles" class="back-link">&larr; Back to Blogs</a>
        <article class="single-blog-post">
            <div class="blog-featured-image">
                <img src="${img}" alt="${imgAlt}"
                    style="width: 100%; height: auto; object-fit: contain; border-radius: 12px; margin-bottom: 30px; display: block;" loading="lazy" decoding="async">

            </div>
            <div class="blog-text-content">
            ${bodyHtml}
            </div>
        </article>
    </div>

    <!-- Footer -->
    <footer id="contact" class="footer-new">
        <div class="container footer-grid">
            <div class="footer-brand">
                <a href="/" class="footer-logo">
                    <img src="assets/images/logo-k9-new-v02.png" alt="Elite K9 Group Logo" class="footer-logo-image" loading="eager" fetchpriority="high" decoding="async" width="300" height="85">
                </a>
                <div class="footer-contact-info">
                    <div class="footer-contact-item">
                        <i class="fas fa-phone-alt"></i>
                        <div class="phone-links">
                            <a href="tel:+18183573797">818-357-3797 <span>Voskan</span></a>
                            <a href="tel:+18188028803">818-802-8803 <span>Simon</span></a>
                        </div>
                    </div>
                    <a href="mailto:info@elitek9group.com" class="footer-contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>info@elitek9group.com</span>
                    </a>
                    <div class="footer-contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>13238 Riverside Dr<br> Sherman Oaks, CA 91423<br>(Near Macy's Mall Los Angeles)</span>
                    </div>
                    <div class="footer-contact-item">
                        <i class="fas fa-clock"></i>
                        <span>Mon - Fri: 9am - 5pm<br>Sat - Sun: 9am - 4pm</span>
                    </div>
                </div>
            </div>
            <div class="footer-nav">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="protection-dog-training-los-angeles">Training</a></li>
                    <li><a href="protection-dog-services">Services</a></li>
                    <li><a href="protection-dogs-for-sale">Dogs for Sale</a></li>
                    <li><a href="dog-breeding-los-angeles-ca">Future Breeding</a></li>
                    <li><a href="elitek9-blog-los-angeles">Blogs</a></li>
                    <li><a href="protection-dog-training-los-angeles#our-team">Perfect duo</a></li>
                </ul>
            </div>
            <div class="footer-locations">
                <h4>Service Areas</h4>
                <div class="locations-grid">
                    <div class="location-col">
                        <a href="consultation">Glendale</a>
                        <a href="consultation">Los Angeles</a>
                        <a href="consultation">Burbank</a>
                        <a href="consultation">West Hollywood</a>
                        <a href="consultation">Beverly Hills</a>
                        <a href="consultation">Studio City</a>
                        <a href="consultation">Santa Monica</a>
                        <a href="consultation">Calabasas</a>
                        <a href="consultation">Pasadena</a>
                        <a href="consultation">Malibu</a>
                        <span style="display: block; padding: 5px 0; color: #999;">...</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="container">
                <p>&copy; 2026 Elite K9 Group. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Floating Phone Button -->
    <a href="#" class="float-phone-btn" aria-label="Call Us Now! We are trainers" id="floatPhoneBtn">
        <i class="fas fa-phone-alt"></i>
        <span class="btn-text">Call Us Now!<br>We are trainers</span>
    </a>

    <!-- Phone Modal -->
    <div id="phoneModal" class="modal-phone">
        <div class="modal-phone-content">
            <span class="close-modal">&times;</span>
            <div class="modal-phone-header">
                <i class="fas fa-phone-alt"></i>
                <h3>Choose a Trainer</h3>
            </div>
            <div class="trainer-links">
                <a href="tel:+18183573797" class="trainer-call-btn">
                    <div class="trainer-info">
                        <span class="trainer-name">Voskan</span>
                        <span class="trainer-number">818-357-3797</span>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
                <a href="tel:+18188028803" class="trainer-call-btn">
                    <div class="trainer-info">
                        <span class="trainer-name">Simon</span>
                        <span class="trainer-number">818-802-8803</span>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </div>
            <div class="modal-phone-hours">
                <p>Please call us during these hours:</p>
                <div class="hours-grid">
                    <span>Mon - Fri:</span> <span>9am - 5pm</span>
                    <span>Sat - Sun:</span> <span>9am - 4pm</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Voice AI -->
    <button id="voiceBtn" aria-label="Talk to AI">
        <i class="fas fa-microphone"></i>
    </button>
    <div id="chat-widget" style="display: none;">
        <div id="chat-header">
            <span>K9 Assistant</span>
            <button id="close-chat-btn">&times;</button>
        </div>
        <div id="chat"></div>
    </div>
    <script src="voice-ai.js"></script>
    <script src="script.js"></script>
<script>
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href^="tel:"]');
  if (!link) return;

  const phone = link.getAttribute('href').replace('tel:', '');

  let location = 'unknown';

  if (link.closest('.navbar')) location = 'header';
  if (link.closest('.footer')) location = 'footer';
  if (link.closest('.modal-phone')) location = 'modal';

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'phone_click',
    phone_number: phone,
    location: location
  });
});
</script>
</body>

</html>
`;
}

function renderBlogCard({ title, slug, excerpt, category, imageSrc, imageAlt }) {
    const t = escapeHtml(title);
    const ex = escapeHtml(excerpt);
    const cat = escapeHtml(category);
    const img = escapeAttr(imageSrc);
    const imgAlt = escapeAttr(imageAlt);
    const s = escapeAttr(slug);
    return `                <article class="blog-card">
                    <div class="blog-image" style="height: auto;"><a href="${s}" class="blog-image-link" aria-label="Open article: ${t}"><img src="${img}" alt="${imgAlt}" srcset="" style="width: 100%; height: auto; object-fit: contain; object-position: center; display: block;" loading="lazy" decoding="async"></a></div>
                    <div class="blog-content">
                        <span class="blog-category">${cat}</span>
                        <h3>${t}</h3>
                        <p>${ex}</p>
                        <a href="${s}" class="read-more">Read Full Article &rarr;</a>
                    </div>
                </article>
`;
}

module.exports = { slugify, bodyTextToHtml, renderPostHtml, renderBlogCard, escapeHtml };
