const { isValidSession } = require('../lib/session');
const { getFile, putTextFile, putBase64File } = require('../lib/github');
const { slugify, bodyTextToHtml, renderPostHtml, renderBlogCard, escapeHtml } = require('../lib/template');

const MIME_EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }
    if (!isValidSession(req)) {
        res.status(401).json({ error: 'not_authenticated' });
        return;
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { title, metaTitle, metaDescription, slug: customSlug, imageAlt: customImageAlt, category, bodyText, imageBase64, imageMime } = body || {};

    if (!title || !String(title).trim()) {
        res.status(400).json({ error: 'missing_title' });
        return;
    }
    if (!bodyText || !String(bodyText).trim()) {
        res.status(400).json({ error: 'missing_body' });
        return;
    }
    if (!imageBase64 || !imageMime || !MIME_EXT[imageMime]) {
        res.status(400).json({ error: 'missing_or_unsupported_image' });
        return;
    }

    const baseSlug = slugify(customSlug && String(customSlug).trim() ? customSlug : title);
    if (!baseSlug || baseSlug.length < 3) {
        // Most likely the title isn't in Latin letters (e.g. Russian), so almost
        // nothing survived slugify(). Ask for an explicit URL instead of
        // publishing a near-empty or meaningless one.
        res.status(400).json({ error: 'need_manual_slug' });
        return;
    }

    try {
        // Make sure we don't silently overwrite an existing page.
        let slug = baseSlug;
        let suffix = 2;
        while (await getFile(`${slug}.html`)) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
            if (suffix > 50) throw new Error('could_not_find_free_slug');
        }

        const ext = MIME_EXT[imageMime];
        const imagePath = `assets/Blogs-img/${slug}.${ext}`;
        const imageAlt = customImageAlt && String(customImageAlt).trim() ? String(customImageAlt).trim() : String(title).trim();
        const dateIso = new Date().toISOString();
        const categoryText = category && String(category).trim() ? String(category).trim() : 'Dog Training';
        const descriptionText = metaDescription && String(metaDescription).trim()
            ? String(metaDescription).trim()
            : String(bodyText).trim().split(/\n+/)[0].slice(0, 160);
        const metaTitleText = metaTitle && String(metaTitle).trim() ? String(metaTitle).trim() : undefined;

        const bodyHtml = bodyTextToHtml(bodyText);
        const postHtml = renderPostHtml({
            title: String(title).trim(),
            metaTitle: metaTitleText,
            slug,
            description: descriptionText,
            category: categoryText,
            imageSrc: imagePath,
            imageAlt,
            bodyHtml,
            dateIso,
        });

        // 1. Upload the cover image.
        await putBase64File(imagePath, imageBase64, `Add blog image for "${title}"`);

        // 2. Create the post page.
        await putTextFile(`${slug}.html`, postHtml, `Add blog post "${title}"`);

        // 3. Insert a card into the blog listing pages. "Blogs" in the nav on
        // every page links to elitek9-blog-los-angeles.html, not blog.html --
        // both exist with their own separate <div class="blog-grid">, so both
        // need the new card or the post won't show up where visitors look.
        const card = renderBlogCard({
            title: String(title).trim(),
            slug,
            excerpt: descriptionText,
            category: categoryText,
            imageSrc: imagePath,
            imageAlt,
            dateIso,
        });
        const listingPages = ['elitek9-blog-los-angeles.html', 'blog.html'];
        for (const page of listingPages) {
            const listing = await getFile(page);
            if (!listing) continue;
            const marker = '<div class="blog-grid">';
            const idx = listing.content.indexOf(marker);
            if (idx === -1) continue;
            const insertAt = idx + marker.length;
            const newListing =
                listing.content.slice(0, insertAt) +
                '\n                <!-- Added via admin -->\n' +
                card +
                listing.content.slice(insertAt);
            await putTextFile(page, newListing, `List new blog post "${title}"`, listing.sha);
        }

        // 4. Keep the homepage's "Latest from the Blog" section (always the
        // newest 3 posts) in sync: add the new card at the top, drop the
        // oldest so it never shows more than 3.
        {
            const home = await getFile('index.html');
            if (home) {
                const marker = '<div class="blog-grid">';
                const idx = home.content.indexOf(marker);
                if (idx !== -1) {
                    const insertAt = idx + marker.length;
                    const before = home.content.slice(0, insertAt);
                    const afterGrid = home.content.slice(insertAt);
                    const articleRe = /<article class="blog-card">[\s\S]*?<\/article>\n?/g;
                    const existingCards = afterGrid.match(articleRe) || [];
                    const keptCards = existingCards.slice(0, 2); // drop the oldest, keep the newest 2 (+ the new one = 3)
                    let gridTail = afterGrid;
                    if (existingCards.length) {
                        const lastCard = existingCards[existingCards.length - 1];
                        const lastIdx = afterGrid.lastIndexOf(lastCard);
                        gridTail = afterGrid.slice(lastIdx + lastCard.length);
                    }
                    const newHome = before + '\n                <!-- Added via admin -->\n' + card + keptCards.join('') + gridTail;
                    await putTextFile('index.html', newHome, `Update homepage latest posts with "${title}"`, home.sha);
                }
            }
        }

        res.status(200).json({ ok: true, slug, url: `https://elitek9group.com/${slug}` });
    } catch (err) {
        res.status(500).json({ error: 'publish_failed', detail: String(err && err.message || err) });
    }
};
