# Vector-Based Matching Algorithm Documentation

## Overview

The JobBridge platform implements a **hybrid matching algorithm** that combines:
1. **Traditional Weighted Scoring** (skills, location, wage)
2. **Vector-Based Semantic Matching** (CV content analysis using TF-IDF)

This approach goes beyond simple keyword matching by understanding the semantic content of worker CVs and gig descriptions.

---

## Algorithm Components

### 1. TF-IDF (Term Frequency - Inverse Document Frequency)

TF-IDF is a numerical statistic that reflects how important a word is to a document in a collection of documents.

#### Term Frequency (TF)
```
TF(word) = (Number of times word appears in document) / (Total words in document)
```

#### Inverse Document Frequency (IDF)
```
IDF(word) = log(Total documents / Number of documents containing the word)
```

#### TF-IDF Score
```
TF-IDF(word) = TF(word) × IDF(word)
```

**Example:**
- Common words like "the", "and" have low IDF scores
- Domain-specific terms like "plumbing", "electrical" have high IDF scores
- This helps identify truly relevant content

---

### 2. Cosine Similarity

Measures the cosine of the angle between two non-zero vectors in an inner product space.

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Where:
- A · B = dot product of vectors A and B
- ||A|| = magnitude of vector A
- ||B|| = magnitude of vector B

**Range:** 0 to 1
- 1 = identical vectors (perfect match)
- 0 = orthogonal vectors (no similarity)

---

### 3. Hybrid Scoring Formula

```
Final Score = (Vector Score × 0.5) + (Traditional Score × 0.5)
```

#### Vector Score (0-100)
- Calculated using TF-IDF and Cosine Similarity
- Compares worker CV text with gig title + description
- Skill mentions in CV get an additional 20% boost

#### Traditional Score (0-100)
- Skills match: 40 points (exact skill match)
- Location match: 30 points (same district)
- Rate match: 30 points (offered ≥ expected)

---

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Worker CV     │────▶│  Text Processing │────▶│  TF-IDF Vector  │
│   (Upload)      │     │  (Tokenization)  │     │  Generation     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Ranked Matches │◀────│  Cosine Similarity│◀────│  Gig Documents  │
│  (Response)     │     │  Calculation     │     │  (TF-IDF Vecs)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Hybrid Scoring  │
                        │  (50/50 Weight)  │
                        └──────────────────┘
```

---

## API Endpoints

### Upload CV
```http
POST /api/cv/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "cvText": "I am a skilled plumber with 5 years of experience...",
  "cvUrl": "https://example.com/cv.pdf" // optional
}
```

**Response:**
```json
{
  "message": "CV uploaded and processed successfully",
  "cvSummary": {
    "wordCount": 250,
    "detectedSkills": ["plumber", "carpenter"],
    "experienceMentions": ["5 years", "2 years"]
  }
}
```

### Get Hybrid Matches
```http
GET /api/match/gigs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "matches": [...],
  "totalMatches": 15,
  "hasCV": true,
  "algorithm": "hybrid",
  "scoring": {
    "vectorWeight": 0.5,
    "traditionalWeight": 0.5
  }
}
```

### Get Vector-Only Matches
```http
GET /api/match/gigs/vector
Authorization: Bearer <token>
```

### Get Traditional Matches
```http
GET /api/match/gigs/traditional
Authorization: Bearer <token>
```

---

## Key Features

### 1. Automatic Skill Extraction
The algorithm automatically extracts skills from CV text:
- Keyword matching for 15+ trade categories
- Pattern recognition for experience levels
- Confidence scoring based on context

### 2. Semantic Understanding
- Understands context beyond exact keyword matching
- Recognizes related terms ("pipe fitting" → "plumber")
- Handles variations in job descriptions

### 3. CV Summary Generation
Automatically generates metadata:
- Word count
- Detected skills
- Experience mentions
- Contact information verification

---

## Comparison: Traditional vs Vector Matching

| Aspect | Traditional | Vector-Based |
|--------|-------------|--------------|
| Matching Method | Exact skill tags | Semantic content analysis |
| Understanding | Binary (match/no match) | Graduated (similarity score) |
| CV Support | No | Yes - full text analysis |
| Context Awareness | Low | High |
| Related Skills | Missed | Detected |
| Computational Cost | Low | Medium |

---

## Example Scenarios

### Scenario 1: Related Skills
**Worker CV:** "I have experience with electrical wiring, circuit installation..."
**Gig:** "Electrician needed for residential wiring"

| Algorithm | Result |
|-----------|--------|
| Traditional | Match (skill: electrician) |
| Vector | Match (semantic similarity: 0.85) |

### Scenario 2: Contextual Understanding
**Worker CV:** "5 years repairing pipes, fixing leaks, installing faucets"
**Gig:** "Plumber needed for bathroom renovation"

| Algorithm | Result |
|-----------|--------|
| Traditional | No Match (no explicit "plumber" skill) |
| Vector | Match (detected: plumbing keywords, similarity: 0.72) |

### Scenario 3: Experience Level
**Worker CV:** "Expert carpenter with 10 years custom furniture building..."
**Gig:** "Entry-level carpenter needed"

| Algorithm | Result |
|-----------|--------|
| Traditional | Match (skill: carpenter) |
| Vector | Lower Match (detects overqualification, similarity: 0.45) |

---

## Technical Implementation

### Dependencies
- No external ML libraries required
- Pure JavaScript/Node.js implementation
- Uses MongoDB for vector storage (Map field)

### Performance Considerations
- TF-IDF vectors computed on-demand
- Pre-processing removes stop words
- Efficient cosine similarity calculation
- Threshold filtering to reduce payload size

### Scalability
- O(N) for N gigs (linear scan)
- Can be optimized with vector indexing for large datasets
- Suitable for 10,000+ documents without external vector DB

---

## Future Enhancements

1. **Word Embeddings** (Word2Vec/GloVe)
   - Capture semantic relationships between words
   - "King" - "Man" + "Woman" ≈ "Queen"

2. **Sentence Transformers**
   - BERT-based embeddings for better context
   - Understand sentence-level semantics

3. **Vector Database**
   - Pinecone, Weaviate, or Milvus
   - Approximate nearest neighbor (ANN) search
   - Sub-millisecond query times at scale

4. **Machine Learning Model**
   - Train on historical match data
   - Learn optimal feature weights
   - Predict match success probability

---

## Mathematical Foundation

### Why Cosine Similarity?

Cosine similarity measures orientation rather than magnitude:
- Two documents with similar content but different lengths get high similarity
- Robust to document length variations
- Efficient to compute with sparse vectors

### Why TF-IDF?

- **TF** captures word importance within a document
- **IDF** reduces weight of common words
- Together they identify distinctive, meaningful terms

### Hybrid Approach Benefits

Combining both methods leverages:
- Vector matching: Discovers implicit relationships
- Traditional matching: Respects hard constraints (location, wage)
- Weighted combination: Tunable based on use case

---

## Conclusion

The vector-based matching algorithm elevates the JobBridge platform from a simple filter system to an intelligent recommendation engine. It provides:

1. **Higher Quality Matches** - Semantic understanding captures nuanced relationships
2. **Better User Experience** - Workers find relevant gigs even with incomplete skill tags
3. **Scalable Architecture** - Efficient implementation without heavy dependencies
4. **Academic Rigor** - Based on established information retrieval techniques

---

## References

1. Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval. *Information Processing & Management*.

2. Singhal, A. (2001). Modern information retrieval: A brief overview. *IEEE Data Engineering Bulletin*.

3. Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to Information Retrieval*. Cambridge University Press.
