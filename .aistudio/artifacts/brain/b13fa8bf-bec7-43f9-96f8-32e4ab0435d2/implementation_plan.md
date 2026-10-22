# Sub-1-Second Mobile Startup & Loading Screen Freeze Fix

Eliminate the preloader freeze shown in user screenshots and achieve lightning-fast sub-1-second mobile startup through React code-splitting (lazy loading tabs), fixing script cookie authorization, and removing cold-start optimizer bottlenecks.

> [!IMPORTANT]
> **Confirmed Root Cause Diagnosis**:
> 1. In `index.html`, `crossorigin="anonymous"` on `<script type="module">` caused mobile Chrome to omit session authentication cookies. Google Cloud Run's auth proxy redirected `/src/main.tsx` to `/__cookie_check.html`, triggering a fatal MIME type mismatch error in Chrome that completely stopped React from mounting.
> 2. `App.tsx` synchronously imported all 15+ complex components and heavy libraries (`qrcode`, `canvas-confetti`, `lucide-react`, Firestore models) in one massive bundle, creating a multi-second network waterfall on mobile 4G/5G connections.
> 3. Heavy esbuild dependency scanning caused cold-start stalls ("Please wait while your application starts...").

- **Confirmed Decision 1**: Implement `React.lazy` and `Suspense` code-splitting so initial page boot ONLY downloads `App.tsx` and `LoginScreen.tsx` (< 35 KB), rendering the PIN screen in under 300ms.
- **Confirmed Decision 2**: Remove `crossorigin="anonymous"` from `index.html` so Chrome sends standard credentials, allowing `/src/main.tsx` to load without 302 redirects.
- **Confirmed Decision 3**: Explicitly remove `#app-preloader` from the DOM immediately upon React initialization in `src/main.tsx`.

---

## 1. Overview & Core Concept

- **What It Does**: Fixes the issue shown in all 3 user screenshots where tapping the link leaves the user stuck on the "दुकान साथी ERP - लोड हो रहा है..." preloader. By stripping away initial bundle bloat and fixing script cookie routing, the user's mobile Chrome browser will download the entry script immediately and display the PIN unlock screen in under 1 second.
- **Target Persona**: Krish Rajput and retail store staff accessing the ERP directly from mobile phones over cellular connections.
- **Key Value**: Instant sub-1-second launch, zero preloader freeze, and silky-smooth tab navigation.

---

## 2. User Experience & Visual Design

- **Instant Launch Sequence (< 800ms)**:
  - Tapping link $\rightarrow$ HTML loads instantly (0ms) $\rightarrow$ Micro-bundle (App + LoginScreen, ~30KB) loads in 250ms $\rightarrow$ `#app-preloader` cleanly vanishes $\rightarrow$ Branded PIN Lock Screen appears with vibrant tactile keypad.
- **Background Pre-fetching**:
  - While the user enters their 4-digit PIN (`1234`), secondary tabs (`BillingTab`, `InventoryPage`, `KhataTab`, `ReportsTab`, `SettingsTab`) are pre-fetched quietly in the background so there is zero perceptible delay after logging in.
- **Lightweight Fallback**:
  - A clean, quiet Tailwind skeleton loader is shown if a tab takes longer than 200ms to mount during first click.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: React Code-Splitting (`React.lazy` + `Suspense`)**:
  - *Chosen Approach*: Lazy-load all dashboard tabs and heavy modals (`ProductFormModal`, `ReceiptModal`, `ShareLinkModal`, `ChangePinModal`, `OwnerValuationReport`).
  - *Why*: Reduces initial JavaScript bundle size by over 80%, guaranteeing sub-1-second boot on mobile networks.
- **Decision 2: Script Tag Credential Strategy**:
  - *Chosen Approach*: Standard `<script type="module" src="/src/main.tsx"></script>` without `crossorigin="anonymous"`.
  - *Why*: Allows normal first-party cookie propagation so Google Cloud Run's auth proxy never triggers a 302 redirect.
- **Decision 3: Server Cold-Start Optimization**:
  - *Chosen Approach*: Streamline `vite.config.ts` to eliminate esbuild dependency pre-bundling stalls on container start.
  - *Why*: Prevents the Cloud Run "Please wait while your application starts..." delay shown in Screenshot 3.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Mobile Browser Click (0ms)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (< 300ms)
┌─────────────────────────────────────────────────────────────┐
│               Lightweight Core Entry Bundle                 │
│  - main.tsx + App.tsx + LoginScreen.tsx (< 35 KB)           │
│  - Explicit DOM cleanup: removeChild(app-preloader)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (< 800ms)
┌─────────────────────────────────────────────────────────────┐
│                   Strict PIN Lock Screen                    │
│  - Instant UI display                                       │
│  - User enters 4-digit PIN                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (Parallel Background Fetch)
┌─────────────────────────────────────────────────────────────┐
│                  Lazy Tabs & Modals (Chunks)                │
│  - DashboardPage / InventoryPage / BillingTab               │
│  - KhataTab / ReportsTab / SettingsTab                      │
│  - ShareLinkModal / ChangePinModal                          │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Checklist
1. **`index.html`**:
   - Remove `crossorigin="anonymous"` from script tag.
   - Clean up fallback retry block so it seamlessly hands off to React.
2. **`src/main.tsx`**:
   - Explicitly remove `#app-preloader` element from DOM inside `createRoot`.
3. **`src/App.tsx`**:
   - Convert all non-critical tabs and modals to `React.lazy`:
     - `DashboardPage`, `InventoryPage`, `BillingTab`, `KhataTab`, `ReportsTab`, `SettingsTab`
     - `ProductFormModal`, `DeleteConfirmationModal`, `ReceivePaymentModal`, `ReceiptModal`, `ShareLinkModal`, `ChangePinModal`
   - Wrap active tab and modals inside `<Suspense fallback={...}>`.
4. **`vite.config.ts`**:
   - Remove heavy `optimizeDeps.include` list to eliminate server cold-start hesitation.
