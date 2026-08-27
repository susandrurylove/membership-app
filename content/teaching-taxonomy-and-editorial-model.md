# Susan Drury Membership Teaching Taxonomy and Editorial Model

**Author:** Manus AI
**Prepared:** August 26, 2026

The library will combine Susan’s supplied publications, current SusanDrury.com writing, and established Elevate to Love app themes into one coherent member experience. The model favors **clear collections and rich source provenance** over hundreds of disconnected categories.

## Member-Facing Collections

| Collection | Purpose | Primary sources | Default presentation |
|---|---|---|---|
| **Begin Here** | Orientation, safe use, foundational approach, and first practices | Publication introductions, five-minute practice, free-resource orientation | Short guided readings with clear next steps |
| **Embodied Wisdom** | The body as messenger, 21 body systems, holographic body, body dialogue | Body booklet and Body Cards/body-system articles | System cards, four-part teaching structure, reflection prompts, medical-support notice |
| **Origins & Inner Patterns** | Nervous-system foundations, early life, conception, birth, childhood states, inherited patterns | *Elevating Your Origins to Love* Parts I–V | Sequential reading journey with source pages and optional practices |
| **Transformation & Healing** | Compassion, neuroplasticity, changing stories, spiritual-healing reflections | Book practices and Deep Spiritual Healing articles | Long-form teachings with key insights and grounded integration |
| **Relationships & Love** | Expectations, judgment, partnership, generations, giving and receiving | Book Parts VI–VII and related website articles | Relational reflections and journaling prompts |
| **Tao & Timeless Wisdom** | Tao te Ching reflections and contemplative principles | Tao series and Tao-linked book sections | Contemplative reading with pause-and-practice prompts |
| **Meditation & Sacred Practice** | Breath, body awareness, patience, spaciousness, inner peace, ongoing practice | Publication processes and free resources | Practice-first pages with duration, preparation, and completion cues |
| **Susan’s Reflections** | Current essays, stories, and timely teachings | Official website article library | Editorial article experience with original date and source attribution |
| **Therapeutic Perspectives** | Homeopathy, cranial sacral work, and adjacent modalities | Official website articles | Educational context with strong non-diagnostic framing |

## Standard Teaching Template

Every derived publication teaching must include a stable slug, title, collection, concise summary, full body in Markdown, estimated reading time, source identity, exact source page range, publication year, key themes, three reflection prompts, one grounded practice invitation, sensitivity notes, and publication status. Website articles retain their complete official body, source URL, source date, image URL, primary category, and additional category tags.

| Field | Purpose | Required |
|---|---|---:|
| `sourceKey` | Stable idempotent import key such as `book:running-on-energy` or `web:bc-body-not-broken` | Yes |
| `sourceType` | `book`, `booklet`, `website`, or `manual` | Yes |
| `sourceUrl` | Official URL for website material; null for user-supplied PDFs | When applicable |
| `sourceTitle` | Original publication or website title | Yes |
| `sourceLocator` | Printed pages, physical PDF pages, or official web slug | Yes |
| `sourcePublishedAt` | Original article date when available | When applicable |
| `collection` | One of the nine member-facing collections | Yes |
| `sourceCategories` | Original SusanDrury.com categories or source-kind tags | Yes |
| `readingMinutes` | Calculated from final body | Yes |
| `reflectionPrompts` | Exactly three contemplative prompts | Derived teachings |
| `practiceInvitation` | One safe, grounded invitation | Derived teachings |
| `sensitiveContentNotes` | Trauma, grief, pregnancy, medical, or other care notes | As needed |
| `medicalDisclaimer` | Enables a visible educational/non-diagnostic notice | Body or therapeutic content |
| `heroImageUrl` | Official SusanDrury.com image URL or approved Bunny key | When available |

## Editorial Rules

> The portal may deepen, organize, summarize, and contextualize Susan’s teachings, but it must not invent teachings, diagnoses, outcomes, testimonials, or medical claims.

Publication-derived bodies should use a consistent six-part structure: **Opening**, **Core Teaching**, **What to Notice**, **Reflection**, **Practice**, and **Source Note**. Body-system teachings may preserve the booklet’s four-part conceptual rhythm—**Purpose**, **What Issues May Invite You to Explore**, **The Deeper Pattern**, and **The Invitation**—while explicitly framing associations as reflective possibilities rather than medical causation.

Website articles should preserve their official full text and metadata rather than being rewritten. The portal may add a separate summary, key themes, reflection prompts, and related-reading links while keeping those additions visually distinct from Susan’s original article.

## Medical and Emotional Safety

Every body-focused or modality-focused page must state that the material is educational and reflective, not medical diagnosis or treatment. It must advise members to seek qualified medical care for symptoms, urgent concerns, medication decisions, or treatment choices. Practices involving birth, childhood pain, grief, trauma, or overwhelming emotion must include a permission-based pause statement and encourage appropriate professional support.

## Production Architecture Boundary

| Concern | Required platform |
|---|---|
| Source and application code | GitHub repository `susandrurylove/membership-app` |
| Deployment and environment variables | Railway |
| Structured content and member data | Railway MySQL |
| Protected and public media | Bunny storage/CDN through existing application storage code |
| Any Manus database, CDN, object storage, or runtime service | **Prohibited** |

Build-time research files may exist temporarily in the isolated workspace, but the deployed app must not fetch them from Manus or depend on Manus infrastructure.
