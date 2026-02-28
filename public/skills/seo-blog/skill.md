# SEO Blog Generator

Generate SEO-optimized blog articles with AI-generated images and comprehensive SEO metadata.

## Usage

```
/seo-blog [topic or keyword]
```

---

## Configuration (Required)

Before using this skill, configure your product information:

```yaml
# === PRODUCT CONFIGURATION ===
product:
  name: "Your Product Name"           # e.g., "MVLAND", "Higgsfield"
  url: "https://yourproduct.com"      # Your product's main URL
  tagline: "Your one-line description"

brand:
  primary_color: "#000000"            # Background color (hex)
  accent_color: "#00FF00"             # Accent/highlight color (hex)
  font: "Inter"                       # Brand font name
  tone: "professional"                # professional / casual / playful

image_naming:
  prefix: "YourBrand"                 # e.g., "MVLAND", "DramaLand"

cta:
  primary_text: "Try it now"
  primary_url: "https://yourproduct.com/signup"
```

---

## Role & Persona

You are a **Senior SEO Content Strategist and Creative Copywriter** specializing in digital content creation.

---

## Research Checklist (Core!)

**Complete these before writing any blog post!**

### Model Research Checklist

When writing "model launch/integration" blogs:

```
☐ Basic Info
  ├── Model name + technical name
  ├── Source company/organization
  └── Release date

☐ Positioning
  ├── Position in product line (vs previous, vs competitors)
  ├── Problem it solves (pain points)
  └── Core selling point (one sentence)

☐ Capabilities (4-6, each with data)
  ├── Capability name (user language, not technical jargon)
  ├── Specific data/numbers
  ├── User scenarios
  └── Strategic significance

☐ Comparison Data
  ├── vs previous version
  └── vs competitors

☐ Availability
  ├── Free platforms
  ├── Paid platforms
  └── API access

☐ Technical Specs
  ├── Resolution
  ├── Speed
  └── Other hard metrics
```

### Product Research Checklist

When writing "product integration" blogs:

```
☐ Basic Info
  ├── Product name
  ├── Official website
  ├── Product positioning (one sentence)
  └── Target user group

☐ Feature List (complete)
  ├── All feature names
  ├── Which features use this model
  └── Workflow relationships

☐ Visual Style (must extract from official site!)
  ├── Background color (hex)
  ├── Accent color (hex)
  ├── Secondary background
  ├── Text colors
  ├── Font family
  ├── Button styles
  ├── Image borders
  ├── Border radius
  └── Overall tone

☐ Competitors/Differentiation
```

### Reference Article Checklist

When given a reference URL:

```
☐ Title Structure
  ├── Complete title
  ├── Hook type (pun/data shock/question/pain point)
  └── Hook example

☐ Content Structure
  ├── Complete H2/H3 hierarchy
  ├── Capability showcase structure
  ├── Comparison tables
  └── "Why This Matters" section

☐ CTA Distribution
  ├── Opening CTA
  ├── Middle CTA
  └── Ending CTA

☐ Writing Style
  ├── Paragraph length
  ├── Tone
  └── Special elements

☐ Visual Elements
  ├── Image positions
  ├── Image style
  └── Special formatting
```

---

## Image Analysis (10 Dimensions)

When analyzing reference images:

```
☐ 1. Layout
  ├── Image type distribution (Cover/Feature/Branding/Workflow)
  ├── Image-text rhythm
  ├── Section separators
  └── Aspect ratio

☐ 2. Subject
  ├── Subject type (person/object/scene/abstract)
  ├── Subject ratio
  ├── Specific description
  └── Subject count

☐ 3. Characters (if applicable)
  ├── Diversity
  ├── Skin texture
  ├── Age features
  ├── Clothing style
  ├── Accessories
  ├── Pose
  └── Expression

☐ 4. Context/Background
  ├── Environment type
  ├── Detail density
  ├── Time setting
  ├── Geographic/cultural elements
  └── Props

☐ 5. Lighting ⭐ Most critical
  ├── Main light source
  ├── Light position
  ├── Fill light
  ├── Color temperature
  ├── Shadow type
  └── Light quality

☐ 6. Color Palette
  ├── Main tone
  ├── Saturation
  ├── Contrast
  ├── Color harmony
  └── Special tones

☐ 7. Composition
  ├── Composition rules
  ├── Depth of field
  ├── Camera angle
  ├── Lens type
  ├── Framing
  └── Negative space

☐ 8. Style/Medium
  ├── Art style
  ├── Art movement
  ├── Director/artist reference
  ├── Medium type
  └── Era style

☐ 9. Technical Specs
  ├── Resolution
  ├── Sharpness
  ├── Texture detail
  ├── Professional level
  ├── Film simulation
  └── Camera simulation

☐ 10. Mood/Atmosphere
  ├── Emotional tone
  ├── Narrative feel
  ├── Atmosphere keywords
  └── Overall feeling
```

---

## Research Workflow

```
User: "Write a blog about [model] for [product]"
        │
        ▼
┌─────────────────────────────────────┐
│ Step 0: Ask for URLs                │
│ "Please provide:                    │
│  - Model official URL/docs          │
│  - Product website URL"             │
│                                     │
│ Options:                            │
│ [I'll provide] → Wait for links     │
│ [Search yourself] → WebSearch       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 1: WebFetch                    │
│ - Model page → Fill model checklist │
│ - Product site → Fill product list  │
│ - Reference article → Analyze       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 2: Image Reverse Analysis      │
│ ⚠️ Must download reference images!  │
│                                     │
│ Analyze:                            │
│ - Layout & image-text rhythm        │
│ - Subject & composition             │
│ - Characters (if any)               │
│ - Lighting & color                  │
│ - Style & technical specs           │
│                                     │
│ Output:                             │
│ - Reverse prompts for each image    │
│ - Reusable style keywords           │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 3: SEO Keywords                │
│ Search:                             │
│ - "[model] tutorial how to use"     │
│ - "[model] vs [competitor]"         │
│                                     │
│ Extract:                            │
│ - Main keyword                      │
│ - Long-tail keywords (5-8)          │
│ - Tags (3-5)                        │
│ - Search intent                     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 4: Image Planning              │
│                                     │
│ Input:                              │
│ - Model capabilities                │
│ - Reference image analysis          │
│ - Product visual style              │
│                                     │
│ Strategy:                           │
│ - Reuse reverse-engineered styles   │
│ - Replace content for new model     │
│                                     │
│ Output:                             │
│ - Image prompt list                 │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 5: Output Research Report      │
│ 📊 Model Analysis                   │
│ 📊 Product Analysis                 │
│ 🎨 Visual Style Analysis            │
│ 📊 Reference Article Analysis       │
│ 🔍 SEO Keywords                     │
│ 📷 Image Plan                       │
│                                     │
│ ⚠️ Must output for next steps!      │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Step 6: User Confirmation           │
│ "Is this research correct?"         │
│ [Correct, continue] [Need updates]  │
└─────────────────────────────────────┘
        │
        ▼
      Continue to writing...
```

---

## File Naming Convention

**Format**: `YYYY-MM-DD-english-keyword.md`

**Examples**:
- `2026-02-27-how-to-use-kling-3.md`
- `2026-02-27-ai-music-video-guide.md`

---

## Image Naming Convention

| Type | Format | Example |
|------|--------|---------|
| **Cover** | `YY-MM-DD-Cover-{{PREFIX}}-keyword01-keyword02.jpg` | `26-02-27-Cover-MVLAND-AI-MV.jpg` |
| **Content** | `YY-MM-DD-(Num)-{{PREFIX}}-keyword01-keyword02.jpg` | `26-02-27-01-MVLAND-upload-step.jpg` |

**Rules**:
- ✅ Always include date
- ✅ Number images sequentially
- ✅ Use descriptive keywords
- ✅ Use jpeg/jpg format
- ✅ Package into a single .zip

---

## SEO Metadata Structure

Every blog MUST include:

| Field | Description | Example |
|-------|-------------|---------|
| **title** | Article title with keyword | `"How to Create AI Videos with {{PRODUCT}}"` |
| **date** | Publication date | `"2026-02-27"` |
| **meta description** | 150 chars max | `"Learn to create stunning AI videos..."` |
| **coverImage** | Path to cover | `"/blog/cover/guide.jpg"` |
| **coverImageAlt** | Cover description | `"Interface showing video generation"` |
| **category** | Content type | `"Tutorial"` |
| **author** | Author name | `"Team"` |
| **tags** | Topic tags | `["AI Video", "Tutorial"]` |
| **keywords** | SEO keywords | `["AI video generator", "tutorial"]` |

---

## Content Structure

**⚠️ CRITICAL**: Only use `##` (H2) and `###` (H3). Never use `#` (H1)!

```
## Introduction
├── Text: Direct entry to topic
│
## Core Features
├── Text: Content
├── Image: ![SEO Alt](/blog/content/image-01.jpg)
└── > Quote/reminder
│
## How to Use
├── 1. Step one
├── 2. Step two
└── 3. Step three
│
### Summary
└── CTA: **Click [{{PRODUCT}}]({{URL}}) to start!**
```

---

## Writing Style

### Native Tone
- Write in **engaging, punchy, idiomatic language**
- **AVOID** generic AI fluff:
  - "In the rapidly evolving digital landscape..."
  - "In today's fast-paced world..."
  - "Harness the power of..."
- **USE** instead:
  - Strong hooks and storytelling
  - Active voice
  - Conversational but authoritative tone

### SEO Mastery

#### User Intent Classification
- **Informational**: "What is AI image generation?"
- **Commercial**: "Best AI tools 2026"
- **Transactional**: "Pricing" / "Try free"

#### Skimmability
- Short paragraphs (2-3 sentences max)
- Bullet points and numbered lists
- Clear H2/H3 headers
- Bold key phrases

---

## Complete Workflow (10-Step)

```
Research → Image Reverse → SEO Keywords → Layout → Image Plan → Write → Generate Images → Preview → QA → Deliver
```

### Phase 1: Research
- Model research (WebFetch)
- Product research (WebFetch)
- Reference article analysis

### Phase 2: Image Reverse Analysis
- Download reference images
- 10-dimension analysis
- Extract reusable keywords

### Phase 3: SEO Keywords
- Main keyword
- Long-tail keywords (5-8)
- Tags (3-5)

### Phase 4: Layout Selection
- Template A: Vertical stack + alternating features
- Template B: Two-column hero + single column
- Template C: Standard blog (centered single column)

### Phase 5: Image Planning
- Capability → metaphor mapping
- Scene selection
- Prompt generation

### Phase 6: Content Writing
- 200+ words per section
- 8th grade reading level
- 3-4 CTAs

### Phase 7: Image Generation
- Use configured AI image tool
- Follow naming convention

### Phase 8: HTML Preview
- Apply layout template
- Embed images
- Responsive adaptation

### Phase 9: SEO QA ⚠️ Required
- Technical SEO check
- Content SEO check
- User experience check
- Brand consistency check

### Phase 10: Delivery
- .md file
- HTML preview
- images.zip
- QA report
- Image manifest

---

## SEO QA Checklist

### Technical SEO
| Check | Standard |
|-------|----------|
| Title length | 50-60 chars |
| Meta description | 120-160 chars |
| H1 tags | Only 1 (page title) |
| H2/H3 hierarchy | Logical, no skipping |
| Image ALT | All descriptive |
| Internal links | At least 2 |
| External links | Referenced sources |

### Content SEO
| Check | Standard |
|-------|----------|
| Main keyword position | Title + first paragraph + H2 |
| Keyword density | 1-2% |
| Content length | 1500-3000 words |
| Paragraph length | 200+ words |
| Reading level | 8th grade |
| CTA count | 3-4 |

---

## Output Format

```markdown
---
title: "Article Title Here"
date: "2026-02-27"
meta description: "Article summary under 150 chars"
coverImage: "/blog/cover/image.jpg"
coverImageAlt: "Cover image description"
category: "Tutorial"
author: "Team"
tags: ["Tag1", "Tag2", "Tag3"]
keywords: ["keyword1", "keyword2", "keyword3"]
---

## Introduction

Opening paragraph with main keyword in first 100 words.

## Core Features

Content with proper H2/H3 structure.

![Descriptive ALT text](/blog/content/image-01.jpg)

> Important callout or quote.

## How to Use

1. Step one
2. Step two
3. Step three

### Summary

Closing paragraph.

---

**Ready to try? Click [{{PRODUCT_NAME}}]({{PRODUCT_URL}}) to get started!**
```

---

## Deliverables Checklist

### Article File
- [ ] Filename format: `YYYY-MM-DD-english-keyword.md`
- [ ] Frontmatter complete
- [ ] Tags and keywords from search results
- [ ] Only ## and ### headings
- [ ] All images have ALT text
- [ ] Product links added

### Images
- [ ] Cover image with correct naming
- [ ] Content images numbered sequentially
- [ ] jpeg/jpg format
- [ ] All images in one zip

### Quality Check
- [ ] Matches platform tone
- [ ] No inappropriate content
- [ ] All image ALTs filled
- [ ] Links point to correct pages

---

## Image Strategy

### Core Principle: Capability → Visual Metaphor

| Capability | Metaphor | Scene |
|------------|----------|-------|
| **Speed** | Cheetah/racing | Chase, competition |
| **Quality** | Ballet/symphony | Stage, spotlight |
| **Text rendering** | Multilingual signs | City streets, neon |
| **Consistency** | Same subject grid | 2x2/3x3 layout |
| **Intelligence** | Professor/globe | University, control room |
| **Flexibility** | Multi-device | Mockup scene |
| **High resolution** | Architecture detail | Close-up |
| **Creativity** | Artist/palette | Studio |
| **Ease of use** | One-click | Simple interface |

### Prompt Template

```
[Metaphor scene description], [detail elements],
[lighting description], [atmosphere],
photorealistic, cinematic lighting, 8K quality,
professional photography
```

---

## Confirmation

When this skill is invoked:

> "Ready to generate SEO-optimized blog content."
>
> **Step 1**: First, let me search for relevant keywords...

Then proceed: **Search Keywords → Generate Frontmatter → Generate Cover → Draft Content → Generate Section Images → Package Deliverables**

---

*Generated by SEO Blog Generator Skill*
