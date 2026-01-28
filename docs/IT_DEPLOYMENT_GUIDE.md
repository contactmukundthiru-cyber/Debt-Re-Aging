# IT Deployment Guide - Credit Report Analyzer PWA

**Version 5.0.0 | For IT Administrators**

---

## Overview

The Credit Report Analyzer is a Progressive Web Application (PWA) that runs entirely in the browser. This guide covers deployment options for institutional environments.

---

## Deployment Options

### Option 1: Static File Hosting (Recommended)

The simplest deployment method - serve the pre-built static files from any web server.

#### Step 1: Build the Application

```bash
cd pwa-app
npm install
npm run build
```

#### Step 2: Deploy Static Files

Copy the contents of `pwa-app/out/` to your web server:

```bash
# Example: Apache
cp -r out/* /var/www/html/credit-analyzer/

# Example: Nginx
cp -r out/* /usr/share/nginx/html/credit-analyzer/

# Example: IIS
xcopy /s /e out\* C:\inetpub\wwwroot\credit-analyzer\
```

#### Step 3: Configure Web Server

**Apache (.htaccess)**
```apache
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.html [L]
</IfModule>
```

**Nginx**
```nginx
server {
    listen 80;
    server_name credit-analyzer.yourdomain.com;
    root /usr/share/nginx/html/credit-analyzer;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # PWA support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache service worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}
```

---

### Option 2: Vercel Deployment

For organizations using Vercel:

```bash
cd pwa-app
npx vercel --prod
```

The `vercel.json` file is pre-configured with security headers.

---

### Option 3: GitHub Pages

For open deployments via GitHub:

1. Push to `main` branch
2. Enable GitHub Pages in repository settings
3. Select `/docs` or use GitHub Actions

---

### Option 4: Docker Deployment

For containerized environments:

```bash
# Build and run
docker-compose up -d

# Access at http://localhost:8501
```

---

## Security Configuration

### Required Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer data |
| Content-Security-Policy | See below | Script/resource restrictions |

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
worker-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

---

## Network Requirements

### Outbound Connections

| Purpose | Domain | Port | Required |
|---------|--------|------|----------|
| Initial load | Your server | 80/443 | Yes |
| Font loading | fonts.googleapis.com | 443 | Optional |
| Font assets | fonts.gstatic.com | 443 | Optional |

**Note:** After initial load, the application works fully offline. No user data is transmitted.

---

## Storage Requirements

### Browser Storage

- **LocalStorage**: ~5-10MB for analysis history and settings
- **IndexedDB**: Not used
- **Session Storage**: Not used

### Server Storage

- Application files: ~50MB
- No database required
- No server-side processing

---

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Mobile Chrome | 90+ | ✅ Fully Supported |
| Mobile Safari | 14+ | ✅ Fully Supported |

---

## Performance Benchmarks

| Metric | Target | Notes |
|--------|--------|-------|
| Initial Load | < 3s | On 3G network |
| Time to Interactive | < 5s | On 3G network |
| Lighthouse Score | 90+ | Performance, Accessibility, Best Practices |
| Bundle Size | < 2MB | Gzipped |

---

## Monitoring & Logging

### Client-Side Errors

Errors are logged to the browser console only. For production monitoring, consider adding:

```javascript
// Optional: Error reporting (does not transmit user data)
window.onerror = function(msg, url, lineNo, columnNo, error) {
    // Log to your monitoring service
    console.error('Application Error:', { msg, url, lineNo, columnNo });
    return false;
};
```

### Server-Side Logging

Standard web server access logs are sufficient:
- Request paths
- Response codes
- Load times

**No user-submitted data is logged.**

---

## Backup & Recovery

### User Data

User data is stored in browser LocalStorage. Recommend instructing users to:

1. Use the "Backup JSON" feature regularly
2. Export analysis history before clearing browser data
3. Store exported files securely per organizational policy

### Application Data

- Source code: Version controlled in Git
- Built files: Reproducible from source
- Configuration: Documented in this guide

---

## Troubleshooting

### PWA Not Installing

1. Verify HTTPS is enabled
2. Check manifest.json is accessible
3. Verify service worker registration

### Offline Mode Not Working

1. Clear browser cache
2. Visit site once with network connection
3. Check service worker status in DevTools

### PDF Processing Slow

1. Use higher resolution scans (300 DPI)
2. Try text-based PDFs over scanned images
3. Paste text directly for fastest processing

---

## Support

- **Documentation**: `/docs/` directory
- **GitHub Issues**: Report bugs or feature requests
- **Email**: contactmukundthiru1@gmail.com

---

*IT Deployment Guide v5.0.0 | January 2026*
