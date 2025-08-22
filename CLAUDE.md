# Jason Cui's Personal Website

## Project Overview
This is a personal website and blog built with Next.js that uses Notion as a CMS for blog posts. The site generates static pages for optimal performance and is deployed on Vercel.

## Tech Stack
- **Framework**: Next.js 13.4.4 with React 18.2.0
- **CMS**: Notion API (@notionhq/client)
- **Styling**: Tailwind CSS with PostCSS
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel
- **Build Type**: Static Site Generation (SSG) with ISR (revalidate: 1)

## Project Structure
```
notion-blog-nextjs/
├── pages/                 # Next.js pages
│   ├── index.js          # Homepage with blog post list
│   ├── [id].js           # Dynamic blog post pages (uses slug or ID)
│   └── _app.js           # App wrapper
├── components/           
│   └── navbar.js         # Navigation component
├── lib/
│   └── notion.js         # Notion API integration
├── styles/               # Global styles
│   └── globals.css       
├── public/               # Static assets
│   └── images/           
└── middleware.ts         # Next.js middleware
```

## Key Features

### Notion Integration
- **Database ID**: Stored in `NOTION_DATABASE_ID` environment variable
- **Auth Token**: Uses `NOTION_TOKEN` for API authentication
- **Content Fetching**: 
  - `getDatabase()`: Retrieves all blog posts
  - `getPage()`: Gets individual page metadata
  - `getBlocks()`: Fetches page content blocks

### Blog Post Management
- **Publishing Status**: Posts must have `Status = "Live"` to be displayed publicly
- **Draft Support**: Shows warning banner for draft posts
- **URL Slugs**: Uses custom `Slug` property from Notion, falls back to page ID
- **Date Sorting**: Posts sorted by `Published` date (newest first)

### Content Rendering
- **Block Types Supported**:
  - Text formatting (bold, italic, code, underline, strikethrough)
  - Headings (h1, h2, h3)
  - Lists (bulleted, numbered, nested)
  - Images (external URLs only, from S3)
  - Code blocks
  - Quotes
  - Dividers
  - Links and bookmarks
  - Files
  - Toggle blocks
- **Unsupported**: Internal Notion images (only external images from S3 are displayed)

### Environment Variables Required
```
NOTION_TOKEN=          # Notion integration token
NOTION_DATABASE_ID=    # ID of the Notion database containing blog posts
```

### Notion Database Schema
Expected properties in Notion database:
- **Name** (title): Post title
- **Status** (select): "Live" or "Draft"
- **Published** (date): Publication date
- **Slug** (text): Custom URL slug (optional)

## Development Commands
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```

## Deployment
- Configured for Vercel deployment
- Uses Incremental Static Regeneration (ISR) with 1-second revalidation
- Remote images from S3 (s3.us-west-2.amazonaws.com) are allowed

## Author Bio
The site owner (Jason Cui) is based in San Francisco, CA. He was cofounder and co-CEO at Jemi (acquired by Brat TV in 2023), a platform for building online stores and websites for entrepreneurs and creatives.

## Recent Updates
- Bio information updated
- Draft post component implementation
- External image display configuration
- Font optimizations removed