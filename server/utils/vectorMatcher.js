/**
 * FINAL MATCHING SYSTEM (FIXED SKILL DETECTION)
 */

/* ---------------- NORMALIZE ---------------- */
const normalize = (str) => str?.toString().trim().toLowerCase();

/* ---------------- TOKENIZE ---------------- */
const tokenize = (text) => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1); // 🔥 FIX: allow small words like "ac"
};

/* ---------------- STOP WORDS ---------------- */
const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'can', 'this', 'that', 'these', 'those'
]);

/* ---------------- PREPROCESS ---------------- */
export const preprocessText = (text) => {
    return tokenize(text)
        .filter(word => !stopWords.has(word))
        .join(' ');
};

/* ---------------- SKILL SYNONYMS ---------------- */
const skillSynonyms = {
    plumber: ['plumber', 'plumbing', 'pipe', 'pipes', 'drain', 'leak', 'faucet'],
    electrician: ['electrician', 'electrical', 'wiring', 'circuit', 'voltage', 'electric'],
    carpenter: ['carpenter', 'carpentry', 'woodwork', 'furniture'],
    painter: ['painter', 'painting', 'paint'],
    mason: ['mason', 'masonry', 'brick', 'cement', 'concrete'],
    driver: ['driver', 'driving', 'vehicle', 'transport'],
    mechanic: ['mechanic', 'engine', 'repair'],
    tailor: ['tailor', 'sewing', 'stitching', 'fabric'],
    cook: ['cook', 'cooking', 'chef', 'kitchen'],
    cleaner: ['cleaner', 'cleaning', 'housekeeping'],
};

/* ---------------- IMPROVED SKILL CATEGORY ---------------- */
const getSkillCategory = (text) => {
    if (!text) return null;

    const words = tokenize(text);
    const fullText = text.toLowerCase();

    for (const [category, synonyms] of Object.entries(skillSynonyms)) {
        for (const term of synonyms) {
            // ✅ exact match
            if (words.includes(term)) return category;

            // ✅ partial match (plumber vs plumbing)
            if (words.some(w => w.startsWith(term) || term.startsWith(w))) {
                return category;
            }

            // ✅ phrase match (pipe fitting, electrical work)
            if (fullText.includes(term)) return category;
        }
    }

    return null;
};

/* ---------------- SKILL MATCH ---------------- */
const isSkillMatch = (workerSkills, gigText) => {
    const gigCategory = getSkillCategory(gigText);

    return workerSkills.some(ws => {
        const workerCategory = getSkillCategory(ws);
        return workerCategory && workerCategory === gigCategory;
    });
};

/* ---------------- TF ---------------- */
const calculateTF = (text) => {
    const words = tokenize(text);
    const tf = {};
    const total = words.length || 1;

    words.forEach(w => tf[w] = (tf[w] || 0) + 1);
    Object.keys(tf).forEach(w => tf[w] /= total);

    return tf;
};

/* ---------------- IDF ---------------- */
export const calculateIDF = (corpus) => {
    const idf = {};
    const N = corpus.length;
    const df = {};

    corpus.forEach(doc => {
        const words = new Set(tokenize(doc));
        words.forEach(w => df[w] = (df[w] || 0) + 1);
    });

    Object.keys(df).forEach(w => {
        idf[w] = Math.log(N / df[w]);
    });

    return idf;
};

/* ---------------- TF-IDF VECTOR ---------------- */
export const createTFIDFVector = (text, idf) => {
    const tf = calculateTF(text);
    const vec = {};

    Object.keys(tf).forEach(w => {
        vec[w] = tf[w] * (idf[w] || 0);
    });

    return vec;
};

/* ---------------- COSINE ---------------- */
const cosineSimilarity = (v1, v2) => {
    const words = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    let dot = 0, m1 = 0, m2 = 0;

    words.forEach(w => {
        const a = v1[w] || 0;
        const b = v2[w] || 0;
        dot += a * b;
        m1 += a * a;
        m2 += b * b;
    });

    m1 = Math.sqrt(m1);
    m2 = Math.sqrt(m2);

    if (m1 === 0 || m2 === 0) return 0;

    return dot / (m1 * m2);
};

/* ---------------- MAIN MATCH ---------------- */
export const smartMatch = (worker, gigs) => {
    const workerSkills = Array.isArray(worker.skills)
        ? worker.skills.map(normalize)
        : [];

    /* -------- HARD FILTER -------- */
    const filtered = gigs.filter(gig => {
        const gigText = [
            gig.skill,
            gig.title,
            gig.description
        ].join(' ');

        // 🔥 FIX: use full gig text
        const skillMatch = isSkillMatch(workerSkills, gigText);
        if (!skillMatch) return false;

        const locationMatch =
            worker.location?.district &&
            normalize(worker.location.district) === normalize(gig.location?.district);

        const rateMatch =
            gig.offeredRate != null &&
            worker.expectedRate != null &&
            gig.offeredRate >= worker.expectedRate;

        return locationMatch || rateMatch;
    });

    if (filtered.length === 0) return [];

    /* -------- VECTOR RANKING -------- */
    const workerText = preprocessText([
        worker.cvText || '',
        ...(worker.skills || [])
    ].join(' '));

    const processedGigs = filtered.map(gig => ({
        ...gig,
        processed: preprocessText([
            gig.title,
            gig.description,
            gig.skill
        ].join(' '))
    }));

    const corpus = [workerText, ...processedGigs.map(g => g.processed)];
    const idf = calculateIDF(corpus);

    const workerVec = createTFIDFVector(workerText, idf);

    const ranked = processedGigs.map(gig => {
        const gigVec = createTFIDFVector(gig.processed, idf);
        const similarity = cosineSimilarity(workerVec, gigVec);

        return {
            ...gig,
            score: Math.round(similarity * 100)
        };
    });

    return ranked.sort((a, b) => b.score - a.score);
};

/* ---------------- CV SUMMARY ---------------- */
export const generateCVSummary = (cvText) => {
    if (!cvText) return null;

    const wordCount = cvText.split(/\s+/).length;

    return {
        wordCount,
        hasEmail: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/.test(cvText),
        hasPhone: /\b\d{7,}\b/.test(cvText)
    };
};

/* ---------------- EXPORT FIX ---------------- */
export const hybridMatch = smartMatch;

/* ---------------- DEFAULT EXPORT ---------------- */
export default smartMatch;