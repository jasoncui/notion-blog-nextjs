# Image Caching System

This project implements a build-time image caching system to solve the problem of Notion's temporary image URLs breaking over time.

## How It Works

1. **Build-Time Processing**: During the Next.js build process (`getStaticProps`), all images from Notion are automatically downloaded and cached locally.

2. **Local Storage**: Images are stored in `public/images/notion/` with hash-based filenames to prevent duplicates and naming conflicts.

3. **Fallback Mechanism**: If image download fails, the system falls back to the original Notion URL.

## Features

- ✅ **Permanent Images**: Downloaded images are stored locally and never expire
- ✅ **Automatic Processing**: No manual intervention required
- ✅ **Deduplication**: Same images are cached only once using MD5 hashing
- ✅ **Format Support**: Supports all image formats (JPG, PNG, WebP, etc.)
- ✅ **Nested Block Support**: Processes images in nested blocks (toggles, etc.)
- ✅ **Fallback Safety**: Falls back to original URLs if download fails

## File Structure

```
public/
└── images/
    └── notion/
        ├── .gitkeep          # Keeps directory in git
        ├── abc123def.jpg     # Cached image files
        └── xyz789uvw.png     # (ignored by git)
```

## Configuration

The system works automatically with no configuration required. However, you can customize:

### Image Cleanup

To clean up images older than 30 days:
```bash
npm run clean-images
```

To clean up images older than a custom number of days:
```bash
node -e "require('./lib/imageUtils.js').cleanupOldImages(7)" # 7 days
```

## Implementation Details

### Key Files

- `lib/imageUtils.js` - Core image processing utilities
- `pages/[id].js` - Updated to use cached images
- `public/images/notion/` - Image storage directory

### Process Flow

1. `getStaticProps` calls `processImagesInBlocks()`
2. Function recursively finds all image blocks
3. Downloads each unique image to local storage
4. Updates block data with local URL
5. Renders images using local URLs

### Error Handling

- Network failures fall back to original URLs
- Invalid URLs are skipped gracefully  
- Build process continues even if some images fail

## Benefits

- **Reliability**: Images never break due to expired URLs
- **Performance**: Images served from your CDN/domain
- **SEO**: Consistent image URLs for search engines
- **Offline**: Works in offline/local development

## Deployment

The system works automatically with:
- Vercel (recommended)
- Netlify  
- Any static hosting platform
- Self-hosted Node.js environments

Images are cached during build time, so no server-side processing is needed in production.
