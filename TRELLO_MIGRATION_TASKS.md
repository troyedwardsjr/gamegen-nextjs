# GameGen Component Migration Trello Tasks

This document contains detailed Trello tasks for migrating glassmorphic components and other reusable assets from unrest_app to the main GameGen application.

## 1. GLASSMORPHIC COMPONENTS MIGRATION

### Task 1.1: Copy GlassmorphicSpinner Component
**Priority:** P1 - High  
**Estimated Effort:** 1 hour  
**Category:** Component Migration  

**Description:**
Copy the GlassmorphicSpinner component from unrest_app to the main GameGen application with proper integration.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/ui/GlassmorphicSpinner.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/ui/GlassmorphicSpinner.tsx`

**Tasks:**
1. Copy the GlassmorphicSpinner.tsx file to the target location
2. Ensure all imports are correctly resolved (@heroui/spinner, @/lib/utils)
3. Update the main components/ui/index.ts to export the new component
4. Test the component in isolation to ensure it renders correctly
5. Verify glassmorphic styling matches design system

**Acceptance Criteria:**
- [ ] Component file copied successfully
- [ ] No import/dependency errors
- [ ] Component renders with correct glassmorphic styling
- [ ] Component exported from ui/index.ts
- [ ] All TypeScript types resolve correctly
- [ ] Component matches visual design specifications

**Dependencies:**
- Requires @heroui/spinner package
- Requires utils library with cn function

**Testing Requirements:**
- Unit test component rendering
- Test different size props (sm, md, lg)
- Test different color props
- Test with and without label prop
- Verify accessibility attributes

---

### Task 1.2: Copy GlassmorphicLoadingOverlay Component
**Priority:** P1 - High  
**Estimated Effort:** 1.5 hours  
**Category:** Component Migration  

**Description:**
Copy the GlassmorphicLoadingOverlay component which provides full-screen loading states with glassmorphic design.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/ui/GlassmorphicLoadingOverlay.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/ui/GlassmorphicLoadingOverlay.tsx`

**Tasks:**
1. Copy the GlassmorphicLoadingOverlay.tsx file
2. Verify all imports resolve correctly
3. Update components/ui/index.ts export
4. Test overlay visibility toggle
5. Verify accessibility attributes and modal behavior

**Acceptance Criteria:**
- [ ] Component copied and imports resolved
- [ ] Overlay appears/disappears correctly based on isVisible prop
- [ ] Proper z-index layering for full-screen overlay
- [ ] Accessibility attributes for modal behavior
- [ ] Glassmorphic backdrop blur effects working
- [ ] Component exported from ui/index.ts

**Dependencies:**
- Requires @heroui/spinner
- Requires utils library
- Requires proper CSS backdrop-blur support

**Testing Requirements:**
- Test overlay show/hide states
- Test different spinner sizes
- Test keyboard navigation and focus management
- Verify screen reader compatibility

---

### Task 1.3: Copy HeroSection Component
**Priority:** P2 - Medium  
**Estimated Effort:** 2 hours  
**Category:** Landing Page Components  

**Description:**
Copy the HeroSection component which is a key landing page element with glassmorphic design and animations.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/HeroSection.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/landing/HeroSection.tsx`

**Tasks:**
1. Create landing components directory if it doesn't exist
2. Copy HeroSection.tsx file
3. Review and adapt content for GameGen platform
4. Update any references to companion-specific features
5. Ensure responsive design works correctly
6. Test animations and interactions

**Acceptance Criteria:**
- [ ] Component copied to landing directory
- [ ] Content adapted for GameGen platform (remove companion references)
- [ ] Responsive design working on all screen sizes
- [ ] Animations and glassmorphic effects working
- [ ] Call-to-action buttons properly linked
- [ ] Performance optimized (lazy loading, etc.)

**Dependencies:**
- May require HeroUI components
- Requires adapted content for GameGen
- Requires proper routing setup

**Testing Requirements:**
- Test on mobile, tablet, desktop
- Test animation performance
- Test call-to-action button functionality
- Verify SEO attributes

---

### Task 1.4: Copy FeatureCard Component
**Priority:** P2 - Medium  
**Estimated Effort:** 1.5 hours  
**Category:** Landing Page Components  

**Description:**
Copy the FeatureCard component for displaying platform features with glassmorphic styling.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/FeatureCard.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/landing/FeatureCard.tsx`

**Tasks:**
1. Copy FeatureCard.tsx to landing components
2. Review and adapt for GameGen platform features
3. Ensure icon compatibility
4. Test responsive behavior
5. Verify glassmorphic styling

**Acceptance Criteria:**
- [ ] Component copied and adapted
- [ ] Icons render correctly
- [ ] Responsive design working
- [ ] Glassmorphic effects intact
- [ ] Content suitable for GameGen features
- [ ] Hover states and interactions working

**Dependencies:**
- Requires icon library compatibility
- May need GameGen-specific feature content

---

### Task 1.5: Copy FeaturesSection Component
**Priority:** P2 - Medium  
**Estimated Effort:** 1.5 hours  
**Category:** Landing Page Components  

**Description:**
Copy the FeaturesSection component which showcases platform capabilities in a grid layout.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/FeaturesSection.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/landing/FeaturesSection.tsx`

**Tasks:**
1. Copy FeaturesSection.tsx
2. Adapt feature content for GameGen
3. Update any feature-specific data
4. Test grid layout responsiveness
5. Verify component integration with FeatureCard

**Acceptance Criteria:**
- [ ] Component copied and adapted
- [ ] Feature content relevant to GameGen
- [ ] Grid layout responsive
- [ ] Integration with FeatureCard component
- [ ] Proper spacing and alignment
- [ ] Performance optimized

**Dependencies:**
- Depends on FeatureCard component
- Requires GameGen feature data

---

### Task 1.6: Copy PricingCard Component
**Priority:** P1 - High  
**Estimated Effort:** 2 hours  
**Category:** Pricing Components  

**Description:**
Copy the PricingCard component for subscription tier display with glassmorphic design.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/PricingCard.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/pricing/PricingCard.tsx`

**Tasks:**
1. Create pricing components directory
2. Copy PricingCard.tsx
3. Adapt pricing tiers for GameGen (Free, Pro, Max)
4. Update feature lists for game creation platform
5. Ensure Stripe integration compatibility
6. Test different pricing tier variants

**Acceptance Criteria:**
- [ ] Component copied to pricing directory
- [ ] Pricing tiers adapted for GameGen
- [ ] Feature lists relevant to game creation
- [ ] Glassmorphic styling preserved
- [ ] CTA buttons properly linked
- [ ] Responsive design working

**Dependencies:**
- Requires GameGen pricing structure
- May need Stripe integration updates

---

### Task 1.7: Copy PricingToggle Component
**Priority:** P2 - Medium  
**Estimated Effort:** 1 hour  
**Category:** Pricing Components  

**Description:**
Copy the PricingToggle component for monthly/yearly pricing display toggle.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/PricingToggle.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/pricing/PricingToggle.tsx`

**Tasks:**
1. Copy PricingToggle.tsx
2. Verify toggle functionality
3. Ensure integration with pricing cards
4. Test animation and state management

**Acceptance Criteria:**
- [ ] Component copied successfully
- [ ] Toggle functionality working
- [ ] Smooth animations
- [ ] State management working
- [ ] Integration with pricing system

**Dependencies:**
- Should integrate with PricingCard component

---

### Task 1.8: Copy PricingFAQ Component
**Priority:** P2 - Medium  
**Estimated Effort:** 2 hours  
**Category:** Pricing Components  

**Description:**
Copy the PricingFAQ component and adapt FAQ content for GameGen platform.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/PricingFAQ.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/pricing/PricingFAQ.tsx`

**Tasks:**
1. Copy PricingFAQ.tsx
2. Replace FAQ content with GameGen-specific questions
3. Update answers for game creation platform
4. Test accordion functionality
5. Verify responsive design

**Acceptance Criteria:**
- [ ] Component copied successfully
- [ ] FAQ content relevant to GameGen
- [ ] Accordion expand/collapse working
- [ ] Responsive design maintained
- [ ] Accessibility attributes present
- [ ] SEO-friendly structure

**Dependencies:**
- Requires GameGen-specific FAQ content

---

### Task 1.9: Copy AuthNavbar Component
**Priority:** P1 - High  
**Estimated Effort:** 3 hours  
**Category:** Navigation Components  

**Description:**
Copy the AuthNavbar component which includes user authentication state management and navigation.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/components/AuthNavbar.tsx`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/components/navigation/AuthNavbar.tsx`

**Tasks:**
1. Create navigation components directory
2. Copy AuthNavbar.tsx
3. Adapt navigation links for GameGen
4. Update authentication integration
5. Test mobile responsive behavior
6. Verify user menu functionality

**Acceptance Criteria:**
- [ ] Component copied to navigation directory
- [ ] Navigation links updated for GameGen routes
- [ ] Authentication state properly managed
- [ ] Mobile menu working correctly
- [ ] User dropdown menu functional
- [ ] Glassmorphic styling preserved

**Dependencies:**
- Requires authentication system integration
- Requires GameGen route structure
- May need mobile menu components

---

## 2. UTILITY AND HELPER FILES MIGRATION

### Task 2.1: Copy Auth Utils Library
**Priority:** P1 - High  
**Estimated Effort:** 2 hours  
**Category:** Utility Migration  

**Description:**
Copy authentication utility functions from unrest_app for consistent auth handling.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/lib/auth/`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/lib/auth/`

**Tasks:**
1. Copy entire auth directory (utils.ts, client-utils.ts, hooks.ts)
2. Review and adapt for GameGen user model
3. Update any companion-specific logic
4. Test authentication flows
5. Ensure TypeScript types are compatible

**Acceptance Criteria:**
- [ ] All auth utility files copied
- [ ] Functions adapted for GameGen user model
- [ ] No companion-specific logic remaining
- [ ] TypeScript compilation successful
- [ ] Authentication flows tested
- [ ] Hook functions working correctly

**Dependencies:**
- Requires Supabase client configuration
- Requires GameGen user type definitions

---

### Task 2.2: Copy Utils Library
**Priority:** P1 - High  
**Estimated Effort:** 1 hour  
**Category:** Utility Migration  

**Description:**
Copy general utility functions including the cn className utility and other helpers.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/lib/utils.ts`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/lib/utils.ts`

**Tasks:**
1. Copy utils.ts file
2. Verify cn function and other utilities
3. Check for any app-specific logic to remove
4. Test utility functions
5. Update imports throughout codebase if needed

**Acceptance Criteria:**
- [ ] utils.ts copied successfully
- [ ] cn function working for className merging
- [ ] All utility functions tested
- [ ] No app-specific logic included
- [ ] TypeScript types correct

**Dependencies:**
- May require clsx and tailwind-merge packages

---

### Task 2.3: Copy Format Utils
**Priority:** P2 - Medium  
**Estimated Effort:** 1 hour  
**Category:** Utility Migration  

**Description:**
Copy formatting utility functions for dates, numbers, etc.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/lib/utils/format.ts`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/lib/utils/format.ts`

**Tasks:**
1. Copy format.ts file
2. Review formatting functions for relevance
3. Test formatting functions
4. Update any locale-specific logic if needed

**Acceptance Criteria:**
- [ ] format.ts copied successfully
- [ ] All formatting functions working
- [ ] Locale handling appropriate
- [ ] TypeScript types correct

---

### Task 2.4: Copy Supabase Configuration
**Priority:** P1 - High  
**Estimated Effort:** 1.5 hours  
**Category:** Configuration Migration  

**Description:**
Copy Supabase client and server configuration files.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/lib/supabase/`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/lib/supabase/`

**Tasks:**
1. Copy supabase directory (client.ts, server.ts, middleware.ts)
2. Update configuration for GameGen database
3. Verify environment variables
4. Test database connections
5. Update any schema-specific logic

**Acceptance Criteria:**
- [ ] All Supabase files copied
- [ ] Configuration updated for GameGen
- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] Middleware integration working

**Dependencies:**
- Requires GameGen Supabase project configuration
- Requires proper environment variables

---

### Task 2.5: Copy Site Configuration
**Priority:** P2 - Medium  
**Estimated Effort:** 1 hour  
**Category:** Configuration Migration  

**Description:**
Copy and adapt site configuration files for GameGen branding and settings.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/config/site.ts`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/config/site.ts`

**Tasks:**
1. Copy site.ts configuration
2. Update site metadata for GameGen
3. Update navigation links
4. Update social links and branding
5. Verify configuration usage throughout app

**Acceptance Criteria:**
- [ ] site.ts copied and adapted
- [ ] Metadata updated for GameGen
- [ ] Navigation links correct
- [ ] Branding information updated
- [ ] Configuration properly used

**Dependencies:**
- Requires GameGen branding assets and information

---

### Task 2.6: Copy Type Definitions
**Priority:** P1 - High  
**Estimated Effort:** 2 hours  
**Category:** Type Migration  

**Description:**
Copy and adapt TypeScript type definitions, focusing on database and reusable types.

**File Paths:**
- Source: `/Users/troyedwards/dev/gamegen_nextjs/unrest_app/nextjs_app/types/`
- Target: `/Users/troyedwards/dev/gamegen_nextjs/types/`

**Tasks:**
1. Review existing type files in source
2. Copy database.ts and index.ts types
3. Remove companion-specific types
4. Add GameGen-specific types (games, projects, etc.)
5. Update imports throughout codebase
6. Ensure type compatibility

**Acceptance Criteria:**
- [ ] Relevant types copied
- [ ] Companion-specific types removed
- [ ] GameGen-specific types added
- [ ] TypeScript compilation successful
- [ ] Type imports updated throughout codebase

**Dependencies:**
- Requires GameGen database schema
- May need to coordinate with existing types/toxoid.ts

---

## 3. LANDING PAGE INTEGRATION TASKS

### Task 3.1: Create Landing Page Layout
**Priority:** P1 - High  
**Estimated Effort:** 2 hours  
**Category:** Landing Page Integration  

**Description:**
Replace the default Next.js landing page with GameGen-specific landing page using copied components.

**File Paths:**
- Target: `/Users/troyedwards/dev/gamegen_nextjs/app/page.tsx`

**Tasks:**
1. Replace current placeholder content in app/page.tsx
2. Import and integrate HeroSection component
3. Add FeaturesSection component
4. Integrate pricing components if needed
5. Ensure responsive design
6. Test component integration

**Acceptance Criteria:**
- [ ] Landing page displays GameGen-specific content
- [ ] HeroSection properly integrated
- [ ] FeaturesSection displaying correctly
- [ ] Responsive design working
- [ ] No console errors or warnings
- [ ] Performance optimized
- [ ] SEO metadata correct

**Dependencies:**
- Requires HeroSection component (Task 1.3)
- Requires FeaturesSection component (Task 1.5)
- May require FeatureCard component (Task 1.4)

---

### Task 3.2: Update Navigation Integration
**Priority:** P1 - High  
**Estimated Effort:** 2 hours  
**Category:** Landing Page Integration  

**Description:**
Ensure navigation components work with the main application routing and authentication.

**File Paths:**
- Update: `/Users/troyedwards/dev/gamegen_nextjs/app/layout.tsx`

**Tasks:**
1. Integrate AuthNavbar component in main layout
2. Update navigation links for GameGen routes
3. Ensure authentication state management
4. Test navigation between pages
5. Verify mobile navigation functionality

**Acceptance Criteria:**
- [ ] AuthNavbar integrated in main layout
- [ ] Navigation links working correctly
- [ ] Authentication state properly managed
- [ ] Mobile navigation functional
- [ ] Routing between all pages working
- [ ] User authentication flow complete

**Dependencies:**
- Requires AuthNavbar component (Task 1.9)
- Requires auth utilities (Task 2.1)
- Requires proper route structure

---

### Task 3.3: Setup Pricing Page Integration
**Priority:** P2 - Medium  
**Estimated Effort:** 1.5 hours  
**Category:** Landing Page Integration  

**Description:**
Create or update pricing page with copied pricing components.

**File Paths:**
- Target: `/Users/troyedwards/dev/gamegen_nextjs/app/pricing/page.tsx`

**Tasks:**
1. Create pricing page if it doesn't exist
2. Integrate PricingCard components
3. Add PricingToggle for monthly/yearly options
4. Include PricingFAQ component
5. Ensure Stripe integration works
6. Test pricing tier selection

**Acceptance Criteria:**
- [ ] Pricing page displays correctly
- [ ] Pricing cards showing GameGen tiers
- [ ] Monthly/yearly toggle working
- [ ] FAQ section functional
- [ ] CTA buttons linked correctly
- [ ] Responsive design working

**Dependencies:**
- Requires PricingCard component (Task 1.6)
- Requires PricingToggle component (Task 1.7)
- Requires PricingFAQ component (Task 1.8)

---

### Task 3.4: Verify End-to-End User Flow
**Priority:** P1 - High  
**Estimated Effort:** 3 hours  
**Category:** Integration Testing  

**Description:**
Test the complete user journey from landing page through authentication to game creator.

**File Paths:**
- Test across multiple pages and components

**Tasks:**
1. Test landing page to signup flow
2. Verify authentication process
3. Test navigation to game creator
4. Verify pricing page functionality
5. Test logout and login flows
6. Check responsive behavior across devices

**Acceptance Criteria:**
- [ ] Landing page loads without errors
- [ ] Signup/login flow works end-to-end
- [ ] Navigation between pages functional
- [ ] Game creator accessible after auth
- [ ] Pricing page fully functional
- [ ] Mobile experience working
- [ ] No broken links or routes
- [ ] Error handling working properly

**Dependencies:**
- Requires all previous tasks to be completed
- Requires authentication system working
- Requires game creator interface functional

---

### Task 3.5: Performance and SEO Optimization
**Priority:** P2 - Medium  
**Estimated Effort:** 2 hours  
**Category:** Optimization  

**Description:**
Optimize landing page performance and SEO after component integration.

**File Paths:**
- Update metadata across pages
- Optimize component loading

**Tasks:**
1. Add proper meta tags for SEO
2. Optimize images and assets
3. Implement lazy loading where appropriate
4. Test Core Web Vitals
5. Verify Open Graph tags
6. Test social media sharing

**Acceptance Criteria:**
- [ ] SEO metadata complete and accurate
- [ ] Core Web Vitals scores acceptable
- [ ] Images optimized and responsive
- [ ] Lazy loading implemented appropriately
- [ ] Social media sharing working
- [ ] Page load performance optimized

**Dependencies:**
- Requires all components integrated
- May need image optimization tools

---

## SUMMARY

**Total Tasks:** 21  
**Estimated Total Effort:** 35.5 hours  

**Priority Breakdown:**
- P1 (High Priority): 12 tasks, 24.5 hours
- P2 (Medium Priority): 9 tasks, 11 hours

**Category Breakdown:**
- Component Migration: 9 tasks, 17 hours
- Utility Migration: 6 tasks, 8.5 hours  
- Landing Page Integration: 5 tasks, 10 hours
- Integration Testing: 1 task, 3 hours

**Critical Path:**
1. Copy core glassmorphic UI components (Tasks 1.1, 1.2)
2. Copy utility libraries (Tasks 2.1, 2.2)
3. Copy navigation components (Task 1.9)
4. Integrate landing page (Task 3.1, 3.2)
5. Test end-to-end flow (Task 3.4)

All tasks include detailed acceptance criteria, dependencies, and testing requirements to ensure successful migration and integration.