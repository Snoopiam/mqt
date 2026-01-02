# MQT Roadmap

## Current Status

**Version**: 1.0 (Stable Diffusion Backend)  
**Status**: ✅ Fully Functional | 🔄 Migration Planned

### What Works Today

✅ **Core Features**

- Upload 2D floor plans (JPG, PNG)
- AI-powered rendering using Stable Diffusion v1.5 + ControlNet MLSD
- 20+ curated architectural style presets with "Forensic DNA"
- Interactive split-view comparison with spring physics slider
- Synchronized zoom & pan for detailed inspection
- Glassmorphism UI with premium aesthetics

✅ **Technical Stack**

- **Frontend**: React 19, Vite, Framer Motion
- **Backend**: FastAPI, Python 3.10
- **AI**: Stable Diffusion v1.5, ControlNet (MLSD)
- **Deployment**: Docker, Google Cloud Run

✅ **Infrastructure**

- Cloud Run deployment with GPU support
- Nginx reverse proxy configuration
- CORS-enabled API for local development

---

## Active Migration: Stable Diffusion → Gemini API

> [!IMPORTANT] > **Major architectural change in progress**  
> Full details in [REMODEL_PLAN.md](file:///c:/SnoopLabs/Labs/MQT/docs/REMODEL_PLAN.md)

### Why Migrate?

**Current Pain Points:**

- **High Infrastructure Cost**: GPU required (4-8GB VRAM) = $0.20-0.50 per generation
- **Slow Generation**: 20-180 seconds per image
- **Complex Deployment**: 7GB model downloads, CUDA dependencies
- **Limited Flexibility**: Hardcoded style presets

**Gemini API Benefits:**

- **10x Faster**: ~5-15 seconds per generation
- **90% Cost Reduction**: ~$0.003-0.02 per generation
- **No GPU Required**: CPU-only deployment
- **Natural Language**: Users can describe styles in plain English
- **Multi-Turn Conversations**: Iterative refinement of results

### Migration Timeline

#### ✅ Phase 0: Planning (Completed)

- [x] Architecture analysis
- [x] Gemini API evaluation
- [x] Migration plan documentation
- [x] Codebase cleanup

#### 🔄 Phase 1: Strip & Clean (Planned)

**Target**: Q1 2026

- [ ] Remove Stable Diffusion code from `main.py`
- [ ] Remove PyTorch, diffusers, ControlNet dependencies
- [ ] Simplify Docker to lightweight Python image
- [ ] Update frontend API client for simplified requests

**Expected Outcome**: Codebase reduced from ~2,400 LOC to <1,500 LOC

#### 🔜 Phase 2: Gemini Integration

**Target**: Q1 2026

- [ ] Add `google-generativeai` SDK
- [ ] Implement new `/api/generate` with Gemini/Imagen 3
- [ ] Migrate style system from hardcoded presets to prompt builder
- [ ] Add error handling for API rate limits
- [ ] End-to-end testing

**Gemini API Options:**

- **Primary**: Imagen 3 for image generation
- **Fallback**: Gemini Vision for analysis + external image gen

#### 📋 Phase 3: UI Overhaul (Planned)

**Target**: Q2 2026

- [ ] Replace forensic DNA cards with natural language input
- [ ] Add quick style chips ("Minimalist", "Photorealistic", "Blueprint")
- [ ] Implement chat-based refinement UI
- [ ] Add result history/gallery
- [ ] Update Hero copy for new capabilities

#### 🚀 Phase 4: Production Deployment

**Target**: Q2 2026

- [ ] Deploy to Cloud Run (CPU-only)
- [ ] Performance benchmarking
- [ ] Cost analysis validation
- [ ] Update documentation
- [ ] Launch announcement

---

## Planned Features (Post-Migration)

### Phase 5: Enhanced Generation

**Target**: Q3 2026

🎯 **Refinement Controls**

- Interactive prompt refinement with Gemini suggestions
- Fine-tune color palettes, lighting, and materials
- Real-time prompt preview before generation

🎯 **Preset Learning**

- Upload your own reference images to create custom styles
- AI extracts "DNA" (colors, lighting, materials) automatically
- Save custom presets to personal library

🎯 **Multi-Format Downloads**

- Export renders as PNG, JPG, WebP, PDF
- High-resolution exports (up to 4K)
- Batch export for multiple styles

🎯 **Advanced Image Understanding**

- Automatic room detection (bedroom, kitchen, etc.)
- Furniture placement suggestions
- Dimension analysis from floor plans

### Phase 6: Collaboration & Sharing

**Target**: Q4 2026

👥 **User Accounts**

- Save projects and generation history
- Organize renders into collections
- Share renders with unique URLs

🔗 **API Access**

- Public API for developers
- Webhook integrations
- Zapier/Make.com connectors

📱 **Mobile Experience**

- Progressive Web App (PWA)
- Mobile-optimized UI
- Touch gesture controls for comparison slider

### Phase 7: Enterprise Features

**Target**: 2027

🏢 **Team Workspaces**

- Multi-user collaboration
- Role-based permissions
- Brand style libraries

📊 **Analytics & Reporting**

- Usage analytics dashboard
- Generation metadata export
- A/B testing for style variations

🔒 **Advanced Security**

- SSO integration (OAuth, SAML)
- Private model deployment
- Audit logging

---

## Long-Term Vision

### AI-First Architecture Platform

MQT aims to become the **go-to platform for AI-assisted architectural visualization**, offering:

1. **Multimodal Generation**

   - Text → Image (describe your dream space)
   - Image → Image (style transfer)
   - 3D → Image (render 3D models)
   - Video → Walkthrough (animated tours)

2. **Intelligent Automation**

   - Auto-generate marketing materials from CAD files
   - Batch process entire project portfolios
   - Integration with BIM tools (Revit, ArchiCAD)

3. **Industry-Specific Solutions**

   - Real estate marketing automation
   - Interior design mood boards
   - Urban planning visualizations
   - Historical building reconstruction

4. **Sustainability Focus**
   - Energy-efficient rendering with AI
   - Material sustainability suggestions
   - Green building visualization

---

## Technology Roadmap

### Frontend Evolution

- [ ] Migrate to TypeScript for type safety
- [ ] Add Storybook for component documentation
- [ ] Implement E2E testing with Playwright
- [ ] Add accessibility improvements (WCAG AA compliance)

### Backend Evolution

- [ ] Add Redis caching for frequent requests
- [ ] Implement job queue for long-running generations
- [ ] Add monitoring with Prometheus/Grafana
- [ ] Set up CI/CD pipeline (GitHub Actions)

### AI/ML Roadmap

- [ ] **Gemini API Integration** (Q1 2026)
- [ ] Experiment with Imagen 3 advanced features
- [ ] Explore multi-modal capabilities (text + image input)
- [ ] Fine-tune custom models for architectural domain
- [ ] Investigate ControlNet alternatives in Gemini ecosystem

---

## Success Metrics

### Technical KPIs

| Metric          | Current (SD) | Target (Gemini) | Status     |
| --------------- | ------------ | --------------- | ---------- |
| Generation Time | 20-180s      | <15s            | 🔜 Planned |
| Cost per Gen    | $0.20-0.50   | <$0.05          | 🔜 Planned |
| Model Download  | 7GB          | 0GB             | 🔜 Planned |
| Cold Start      | 60-120s      | <5s             | 🔜 Planned |
| GPU Required    | Yes          | No              | 🔜 Planned |

### Product KPIs (2026 Goals)

- **Monthly Active Users**: 1,000+
- **Generations per Day**: 500+
- **User Retention (30-day)**: >40%
- **Average Session Duration**: >10 minutes

---

## Contributing

We welcome contributions! Here's how you can help:

### For Developers

- 🐛 **Bug Fixes**: Check issues labeled `bug`
- ✨ **Features**: Pick from issues labeled `enhancement`
- 📚 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add unit/integration tests

### For Designers

- 🎨 **UI/UX**: Improve interface designs
- 🖼️ **Assets**: Create icons, illustrations
- 📝 **Copy**: Refine messaging and documentation

### For Domain Experts

- 🏗️ **Architecture**: Suggest better style presets
- 🎓 **Education**: Create tutorials and case studies
- 💼 **Business**: Provide user feedback and feature requests

**Contribution Guide**: See `CONTRIBUTING.md` (coming soon)

---

## Release Schedule

### 2026 Releases

**Q1 2026**: v2.0 - Gemini Migration

- Gemini API integration
- Simplified architecture
- Cost reduction

**Q2 2026**: v2.1 - Enhanced Features

- Natural language prompts
- Preset learning
- Multi-format downloads

**Q3 2026**: v2.2 - Collaboration

- User accounts
- Project history
- Sharing features

**Q4 2026**: v3.0 - Enterprise

- Team workspaces
- API access
- Advanced analytics

---

## Risks & Mitigations

| Risk                    | Impact | Mitigation                       |
| ----------------------- | ------ | -------------------------------- |
| Gemini API availability | High   | Fallback to alternate providers  |
| API rate limits         | Medium | Implement caching + queue system |
| Quality regression      | Medium | A/B testing, user feedback loops |
| Cost overruns           | Low    | Usage monitoring, quotas         |
| User adoption           | Medium | Marketing, tutorials, free tier  |

---

## Questions & Feedback

Have ideas for the roadmap? Open a discussion or contact:

- **Email**: support@snooplabs.ai
- **GitHub Issues**: [github.com/Snoopiam/mqt/issues](https://github.com/Snoopiam/mqt/issues)

---

_Last Updated: December 11, 2025_  
_Roadmap Version: 1.0_
