# Using Claude Code (Opus 4) Effectively for Hromada

A practical guide for getting the best results from Claude Code when working on the Hromada platform.

---

## 1. The CLAUDE.md File (Already Created)

The single most impactful thing is the `CLAUDE.md` file at the project root. Claude Code reads this automatically at the start of every session. It contains:

- What the project is and who the team is
- The full tech stack
- Architecture and file structure conventions
- The design system (colors, fonts, patterns)
- Common pitfalls to avoid
- Build and run commands

**This file is already in your repo at `/CLAUDE.md`.** Keep it updated as the project evolves. Every new convention, every hard lesson, every decision you make -- add it there. It compounds over time.

---

## 2. Session Opening Prompts

### Starting a New Session (General Work)

When you open Claude Code for a new session, it reads CLAUDE.md automatically. For most work, you can just describe what you want. But for complex sessions, prime it:

```
I'm working on Hromada today. Before we start, read CLAUDE.md and familiarize
yourself with the project. I'll be working on [area] today.
```

### Starting a Session (Specific Branch)

```
I'm working on the v2-payment-processing branch today. Check out that branch
and load it on localhost:3000. I'll be making changes to [specific area].
```

### Starting a Session (Design/UI Work)

```
I'm doing UI work on Hromada today. Before making any changes, remember:
we use a warm cream/navy theme with CSS custom properties, NOT Tailwind grays.
Background is var(--cream-50), text is var(--navy-700), accent is var(--warm-500).
All text must be added to both en.json and uk.json locale files.
```

---

## 3. Task-Specific Prompts

### Before Adding a New Page

```
I want to add a new page at /[locale]/(public)/[page-name]. Before building it:

1. Look at an existing page like about/page.tsx or contact/page.tsx for the pattern
2. Use the cream theme (var(--cream-50) background, var(--navy-700) headings)
3. Include the Header component
4. Use useTranslations() for all user-facing text
5. Add translation keys to BOTH locales/en.json and locales/uk.json
6. Keep it consistent with the existing pages' visual style
```

### Before Modifying Components

```
I want to change [component]. Before editing:

1. Read the component file first
2. Check where it's imported and used (search for imports)
3. Don't change the component's public API unless I ask
4. Keep the cream/navy theme
5. If it affects translations, update both locale files
```

### Before Working on API Routes

```
I need to [add/modify] an API route for [purpose]. Follow our existing patterns:

1. Look at an existing route like api/projects/route.ts for the pattern
2. Use Prisma for database queries
3. Add proper auth checks (verifyAdminAuth/verifyPartnerAuth as appropriate)
4. Include rate limiting for public endpoints
5. Add audit logging for admin actions
6. Handle errors with proper HTTP status codes
7. Validate input with Zod
```

### Before Working on the Map

```
I'm modifying the map functionality. Key context:

1. We use Leaflet with react-leaflet and react-leaflet-cluster
2. Map components are in src/components/map/
3. We show city-level coordinates ONLY (wartime security)
4. Category colors: Hospital=#C75B39, School=#7CB518, Water=#3B8EA5, Energy=#E6A855
5. The map loads all projects with ?all=true API param
6. Custom cluster markers use warm palette styling
```

### Before Writing Tests

```
I want to add tests for [component/route]. Follow our testing patterns:

1. Look at existing tests in src/__tests__/ for the pattern
2. We use Jest + React Testing Library
3. Mock next-intl with useTranslations returning a function that returns the key
4. Mock next/navigation (useRouter, useParams, etc.)
5. Mock framer-motion
6. Test rendering, user interactions, and edge cases
7. Run with: npm test -- --testPathPattern=[test-file]
```

---

## 4. Prompts for Specific Recurring Tasks

### Deploying to Production

```
Push the current changes on main to GitHub and deploy. The site auto-deploys
on Amplify from the main branch. If the push fails with a 500, retry.
```

### Adding Translations

```
I need to add the following text to the site: "[text]"

Add it to both locales/en.json and locales/uk.json with an appropriate key
following the existing naming convention. For Ukrainian, translate it naturally
(not literally). The key should be namespaced like the existing keys
(e.g., about.sectionName, nav.itemName, homepage.featureText).
```

### Fixing Hover/Dropdown Issues

```
The [dropdown/tooltip/menu] disappears when moving from the trigger to the
content. This is a common issue in our codebase. The fix is: move the
onMouseEnter/onMouseLeave handlers to the PARENT container that wraps both
the trigger element and the dropdown content, and use a timeout ref to
add a small delay before closing.
```

### Working Across Branches

```
I need to bring [feature/fix] from [branch-a] to [branch-b].

1. Stash any current changes
2. Check out the target branch
3. Cherry-pick or manually apply the changes
4. Handle any conflicts carefully -- quote paths with [locale] in them
5. Test that it works
6. Commit with a clear message
```

---

## 5. Prompt Patterns That Get Better Results

### Be Specific About What NOT to Do

Claude Code works best when you tell it constraints, not just goals:

```
# GOOD
Add a FAQ section to the homepage. Use the existing FAQItem component from
the about page. Don't add any new dependencies. Don't change the existing
sections -- just add the FAQ below the project listing.

# LESS GOOD
Add a FAQ section to the homepage.
```

### Reference Existing Patterns

```
# GOOD
Add a new filter chip for project type, following the same pattern as the
existing category and urgency filter chips on the homepage.

# LESS GOOD
Add a project type filter.
```

### Break Complex Work Into Steps

```
# GOOD
Let's restructure the about page. Here's what I want:

1. First, show me the current page structure (section headings and order)
2. I want to move the FAQ section above the partners section
3. Add a horizontal divider between sections
4. Keep all existing content, just reorder it

# LESS GOOD
Restructure the about page to flow better.
```

### Tell It When to Stop

```
# GOOD
Fix the sort dropdown hover bug on the homepage. Only change the hover
handlers -- don't refactor the dropdown markup or styling.

# LESS GOOD
Fix the sort dropdown.
```

---

## 6. Project-Specific Rules to Enforce

Add these to your prompts when relevant:

### Theme Enforcement
```
Remember: Hromada uses a warm cream/navy theme. Never use:
- bg-gray-*, text-gray-*, border-gray-* on themed elements
- Pure white backgrounds (use var(--cream-50) instead)
- Blue or indigo accents (use var(--navy-*) or var(--warm-*) instead)
```

### i18n Enforcement
```
Every user-facing string must use useTranslations(). Never hardcode English
text in JSX. Add keys to BOTH en.json and uk.json.
```

### Security Enforcement
```
Never expose exact facility coordinates. Use city-level coordinates only.
Never log sensitive data (passwords, tokens, emails in audit logs).
Always validate and sanitize user input on API routes.
```

---

## 7. When Things Go Wrong

### Claude Code Makes Unwanted Changes

```
Revert the last change to [file]. I only wanted [specific thing],
not [what it did]. Please re-read the file and only change [specific lines/section].
```

### Lost Track of What Changed

```
Show me a git diff of all uncommitted changes. Walk me through each
file that changed and what was modified.
```

### Build Breaks After Changes

```
The build is broken after the last change. Run npm run build and show
me the errors. Fix only the errors -- don't refactor or change anything else.
```

### Wrong Branch

```
I'm on the wrong branch. Stash everything, switch to [branch],
and apply the stash there.
```

---

## 8. Multi-Session Workflow

For work that spans multiple Claude Code sessions:

### End of Session
```
Before we end: commit all changes with a clear message, push to [branch],
and give me a summary of what was done and what's left to do.
```

### Start of Continuation Session
```
I'm continuing work from a previous session. Last time we [summary].
The changes were committed as [commit hash/message].
Today I want to continue with [next steps].
```

---

## 9. Leveraging Plan Mode

For complex features, use plan mode:

```
I want to add [complex feature]. Enter plan mode and:

1. Explore the relevant parts of the codebase
2. Identify all files that need to change
3. Note any patterns we should follow from existing code
4. Propose an implementation plan for my review before writing any code
```

This prevents Claude Code from charging ahead with the wrong approach on big changes.

---

## 10. Quality Checklist Prompt

Use this as a final check before deploying:

```
Before I deploy, verify:

1. Run npm run build -- does it succeed?
2. Are there any TypeScript errors?
3. Did we add translation keys to BOTH en.json and uk.json?
4. Are we using cream/navy theme variables, not gray?
5. Are hover handlers on parent containers (not just triggers)?
6. Does the mobile layout look reasonable? (check for hidden/shown breakpoints)
7. Run the tests -- do they pass?
```

---

## Summary

The key principles for using Claude Code effectively on Hromada:

1. **CLAUDE.md is your foundation** -- keep it updated, it's read every session
2. **Be specific** about constraints, not just goals
3. **Reference existing patterns** -- "like the about page" is better than describing from scratch
4. **Enforce the theme** -- cream/navy, not gray, every time
5. **Both locales** -- en.json AND uk.json, always
6. **Plan mode for big changes** -- don't let it start coding complex features without a plan
7. **Break work into steps** -- smaller, focused prompts get better results than big asks
8. **Tell it when to stop** -- prevent over-engineering by being explicit about scope
