# 📚 RumVue Documentation

Complete documentation for the RumVue project - Vue.js & Nuxt.js environment with Elastic APM RUM (Real User Monitoring) integration.

## 🚀 Getting Started

New to RumVue? Start here:

- **[Quick Start Guide](getting-started/quickstart.md)** - Get up and running in 5 minutes
- **[Elastic Stack Setup](getting-started/elastic-setup.md)** - Set up local Elastic Stack with Docker

## 📖 Guides

Comprehensive guides for all features:

### APM & Monitoring
- **[APM Setup and Usage](guides/apm-setup.md)** - Complete guide to Elastic APM RUM integration
- **[Timeline Filtering](guides/timeline-filtering.md)** - Advanced timeline filtering techniques in Kibana
- **[Component Tracking](guides/component-tracking.md)** - Track Vue components with APM

### Development
- **[Source Map Upload](guides/sourcemap-upload.md)** - Upload source maps for better error tracking

## 🔧 Troubleshooting

Having issues? Check these guides:

- **[WSL2 TypeScript Setup](troubleshooting/wsl2-typescript.md)** - Fix TypeScript issues in WSL2 environment

## 📊 Reports

Technical reports and analysis:

- **[Development Work Report](reports/work-report.md)** - Historical development work log
- **[RUM Agent Feasibility Study](reports/rum-agent-feasibility.md)** - Automation feasibility analysis

## 📂 Documentation Structure

```
docs/
├── README.md                          # This file - Documentation index
├── getting-started/                   # Quick start and setup guides
│   ├── quickstart.md
│   └── elastic-setup.md
├── guides/                            # Feature guides and tutorials
│   ├── apm-setup.md
│   ├── sourcemap-upload.md
│   ├── timeline-filtering.md
│   └── component-tracking.md
├── troubleshooting/                   # Problem-solving guides
│   └── wsl2-typescript.md
└── reports/                           # Technical reports and analysis
    ├── work-report.md
    └── rum-agent-feasibility.md
```

## 🔗 Quick Links

- [Main Project README](../README.md)
- [Environment Variables Template](../.env.example)
- [Kibana Dashboard](http://localhost:5601) (requires Elastic Stack running)
- [APM Server](http://localhost:8200) (requires Elastic Stack running)

## 💡 Contributing

When adding new documentation:

1. Choose the appropriate category (getting-started, guides, troubleshooting, reports)
2. Use clear, descriptive filenames (lowercase with hyphens)
3. Add an entry to this index file
4. Update cross-references in related documents
5. Follow the existing documentation style

## 📝 Documentation Guidelines

- **Getting Started**: Step-by-step setup and installation guides
- **Guides**: Feature documentation, tutorials, and how-tos
- **Troubleshooting**: Common issues and their solutions
- **Reports**: Technical analysis, research, and historical records

---

**Need help?** Check the [Main README](../README.md) or open an issue on GitHub.
