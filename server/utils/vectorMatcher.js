/**
 * FINAL MATCHING SYSTEM (FIXED SKILL DETECTION)
 */

/* ---------------- NORMALIZE ---------------- */
const normalize = (str) => str?.toString().trim().toLowerCase();
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const hasWholeTerm = (text, term) => {
    if (!text || !term) return false;
    const rx = new RegExp(`\\b${escapeRegExp(term.toLowerCase())}\\b`, 'i');
    return rx.test(text);
};

/* ---------------- SKILL CATEGORY ---------------- */
const getSkillCategory = (text) => {
    if (!text) return null;

    const words = tokenize(text);
    const fullText = text.toLowerCase();

    for (const [category, synonyms] of Object.entries(skillSynonyms)) {
        for (const term of synonyms) {
            // Only allow full word/term matches to avoid false positives
            if (words.includes(term) || hasWholeTerm(fullText, term)) return category;
        }
    }

    return null;
};

/* ---------------- SKILL MATCH ---------------- */
const isSkillMatch = (workerSkills, gigText) => {
    const gigCategory = getSkillCategory(gigText);
    const normalizedGigTokens = new Set(tokenize(gigText || ''));

    return workerSkills.some(ws => {
        const normalizedWs = normalize(ws);
        if (!normalizedWs) return false;

        // Strict direct skill-tag match
        if (normalizedGigTokens.has(normalizedWs)) return true;

        // Controlled category match for known trade skills only
        const workerCategory = getSkillCategory(normalizedWs);
        return Boolean(workerCategory && gigCategory && workerCategory === gigCategory);
    });
};

const buildGigSkillText = (gig) => [
    gig.skill,
    ...(Array.isArray(gig.skills) ? gig.skills : [])
].filter(Boolean).join(' ');

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

/* ---------------- CV SUMMARY ---------------- */
export const generateCVSummary = (cvText) => {
    if (!cvText) return null;

    const normalizedText = cvText.toLowerCase();
    const wordCount = cvText.split(/\s+/).length;
    const detectedSkills = new Set();
    const experienceMentions = [];

    // Detect skills from synonym dictionary with strict whole-term match
    Object.values(skillSynonyms).forEach(synonyms => {
        synonyms.forEach(term => {
            if (hasWholeTerm(normalizedText, term)) {
                detectedSkills.add(term);
            }
        });
    });

    // Simple extraction for "X years/months experience" style phrases
    const experiencePatterns = [
        /\b\d+\+?\s*(?:years?|yrs?)\s*(?:of\s+)?experience\b/gi,
        /\b\d+\+?\s*(?:months?|mos?)\s*(?:of\s+)?experience\b/gi,
        /\b(?:experienced?|experience)\s+(?:in|with)\s+[a-z\s]{2,40}\b/gi
    ];

    experiencePatterns.forEach(rx => {
        const matches = normalizedText.match(rx) || [];
        matches.forEach(m => {
            if (experienceMentions.length < 10) {
                experienceMentions.push(m.trim());
            }
        });
    });

    const hasEmail = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/.test(cvText);
    const hasPhone = /\b(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){7,}\d\b/.test(cvText);

    return {
        wordCount,
        detectedSkills: Array.from(detectedSkills),
        experienceMentions,
        hasContactInfo: hasEmail || hasPhone,
        hasEmail,
        hasPhone
    };
};

/* ---------------- VECTOR-ONLY MATCH ---------------- */
export const matchByVector = (worker, gigs, options = {}) => {
    const threshold = options.threshold ?? 15;
    const profileSkills = Array.isArray(worker.skills) ? worker.skills : [];
    const cvDetectedSkills = Array.isArray(worker.cvSummary?.detectedSkills)
        ? worker.cvSummary.detectedSkills
        : [];
    const workerSkills = [...new Set([...profileSkills, ...cvDetectedSkills].map(normalize).filter(Boolean))];

    if (!Array.isArray(gigs) || gigs.length === 0) return [];

    const workerText = preprocessText([
        worker.cvText || '',
        ...profileSkills,
        ...cvDetectedSkills
    ].join(' '));

    const processedGigs = gigs.map(gig => ({
        ...gig,
        skillText: buildGigSkillText(gig),
        fullText: [
            gig.title,
            gig.description,
            gig.skill,
            ...(Array.isArray(gig.skills) ? gig.skills : [])
        ].join(' '),
        processed: preprocessText([
            gig.title,
            gig.description,
            gig.skill,
            ...(Array.isArray(gig.skills) ? gig.skills : [])
        ].join(' '))
    }));

    const corpus = [workerText, ...processedGigs.map(g => g.processed)];
    const idf = calculateIDF(corpus);
    const workerVec = createTFIDFVector(workerText, idf);

    return processedGigs
        .map(gig => {
            const shouldApplySkillGate = workerSkills.length > 0;
            if (shouldApplySkillGate && !isSkillMatch(workerSkills, gig.skillText)) return null;
            const gigVec = createTFIDFVector(gig.processed, idf);
            const vectorScore = Math.round(cosineSimilarity(workerVec, gigVec) * 100);
            return {
                ...gig,
                vectorScore,
                matchScore: vectorScore,
                score: vectorScore
            };
        })
        .filter(Boolean)
        .filter(gig => gig.vectorScore >= threshold)
        .sort((a, b) => b.vectorScore - a.vectorScore);
};

/* ---------------- DEFAULT EXPORT ---------------- */
export default matchByVector;