# Twelve Thirty Four

A minimal, elegant Shopify theme designed for artisans, florists, ceramicists, and creative small businesses. Built with a focus on beautiful typography, smooth animations, and a refined aesthetic that lets your products shine.

![Theme Version](https://img.shields.io/badge/version-1.0.0-B76A6A)
![Shopify](https://img.shields.io/badge/Shopify-Online%20Store%202.0-7AB55C)

---

## ✨ Features

### Design & Layout
- **Clean, minimal aesthetic** — Designed to showcase products without distraction
- **Flexible color schemes** — 4 pre-configured schemes (light, dark, charcoal, cream)
- **Typography control** — Choose from Shopify's font library for headings and body text
- **Responsive design** — Optimized for all devices from mobile to desktop
- **Configurable page widths** — Narrow (1200px), Standard (1400px), or Wide (1600px)

### Sections
- **Hero Slideshow** — Full-screen or custom height with parallax effect, autoplay, and navigation dots
- **Featured Collection** — Showcase your best products with customizable grid layouts
- **Image with Text** — Flexible content blocks for storytelling
- **Newsletter** — Email signup section with customizable styling
- **Contact Form** — Beautiful contact page template
- **Collection Links** — Visual navigation to your collections
- **Slideshow with Text** — Additional slideshow options

### E-Commerce
- **Cart Drawer** — Slide-out cart for seamless shopping experience
- **Cart Page** — Traditional full-page cart option
- **Cart Notes** — Optional order notes for customers
- **Product Recommendations** — AI-powered related products

### Customization
- **Logo & Favicon** — Upload your branding with separate light/dark logo variants
- **Button Styles** — Solid or outline buttons with adjustable corner radius
- **Section Spacing** — Control the rhythm of your page layout
- **Social Media Links** — Instagram, Facebook, Pinterest, TikTok, Twitter/X

---

## 🚀 Installation

### Via Shopify Admin

1. Go to your Shopify Admin → **Online Store** → **Themes**
2. Click **Add theme** → **Upload zip file**
3. Upload the theme ZIP file
4. Click **Customize** to start editing

### Via Shopify CLI

```bash
# Navigate to the theme directory
cd themes/twelve-thirty-four

# Connect to your store
shopify theme dev --store=your-store.myshopify.com

# Push to your store
shopify theme push --store=your-store.myshopify.com
```

---

## 🎨 Color Schemes

The theme includes 4 pre-configured color schemes:

| Scheme | Background | Text | Accent |
|--------|-----------|------|--------|
| **Scheme 1** (Light) | `#FFFFFF` | `#111111` | `#B76A6A` |
| **Scheme 2** (Dark) | `#111111` | `#FFFFFF` | `#B76A6A` |
| **Scheme 3** (Charcoal) | `#2C2C2C` | `#FFFFFF` | `#B76A6A` |
| **Scheme 4** (Cream) | `#F5F5F0` | `#111111` | `#B76A6A` |

All schemes can be customized in **Theme Settings → Colors**.

---

## 📁 Theme Structure

```
twelve-thirty-four/
├── assets/          # CSS, JS, and static assets
├── blocks/          # Reusable block components
├── config/          # Theme settings and data
├── layout/          # Base layout templates
├── locales/         # Translation files
├── sections/        # Page sections
├── snippets/        # Reusable code snippets
└── templates/       # Page templates (JSON)
```

---

## 🔧 Development

### Requirements

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) v3.0+
- Node.js v18+

### Local Development

```bash
# Start development server with hot reload
shopify theme dev --store=your-store.myshopify.com

# Check theme for errors
shopify theme check

# Push changes to your store
shopify theme push
```

---

## 📝 Templates

| Template | Description |
|----------|-------------|
| `index.json` | Homepage |
| `product.json` | Product detail page |
| `collection.json` | Collection/catalog page |
| `cart.json` | Shopping cart |
| `page.json` | Standard pages |
| `page.contact.json` | Contact page |
| `404.json` | Page not found |

---

## 🤝 Support

- **Documentation**: [twelvethirtyfour.com/docs](https://twelvethirtyfour.com/docs)
- **Support**: [twelvethirtyfour.com/support](https://twelvethirtyfour.com/support)

---

## 📄 License

© 2024 Twelve Thirty Four Studio. All rights reserved.

---

<p align="center">
  Made with care for small businesses ✿
</p>

