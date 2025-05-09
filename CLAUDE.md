# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Start the development server
pnpm dev

# Build the application
pnpm build

# Start the production server
pnpm start

# Lint the codebase
pnpm lint

# Build worker for Cloudflare
pnpm build:worker

# Preview with Cloudflare Wrangler
pnpm preview

# Generate Cloudflare type definitions
pnpm cf-typegen
```

## Architecture

This is a Next.js application that generates stone mockups for countertop fabrication and similar purposes. The main features include:

1. **Stone Mockup Generation**: Users can specify dimensions, material properties, and polished edges, then generate visual mockups.
2. **Export Functionality**: Mockups can be exported as PNG or PDF files.
3. **Multi-piece Support**: Users can save multiple stone pieces and export them together.

### Core Components

- `/src/components/stone-generator/StoneGenerator.tsx`: Main component for creating stone mockups
- `/src/components/stone-generator/StoneMockupApp.tsx`: Wrapper component for the entire application

### Key Libraries and Tools

- **Next.js**: React framework for the application
- **jsPDF**: Library for PDF generation
- **TailwindCSS**: For styling
- **Radix UI**: For UI components
- **TypeScript**: For type safety

### Data Flow

1. User inputs stone specifications through form components
2. Specifications are stored in local storage for persistence
3. Canvas drawing utilities render the mockup based on specifications
4. Export utilities convert the canvas to PNG or PDF format

### Utility Libraries

- `/src/lib/drawing-utils.ts`: Canvas drawing utilities for the mockup
- `/src/lib/export-utils.ts`: Utilities for exporting mockups to PNG and PDF
- `/src/lib/fraction-utils.ts`: Utilities for handling fraction inputs and conversions
- `/src/types/stone.ts`: TypeScript interfaces for stone specifications and projects

### Local Storage

The application uses local storage to persist:
- Current stone specifications
- Display options
- Notes
- Saved pieces

## Important Notes

- The application is designed to work on both desktop and mobile devices
- Fraction inputs are supported for precise measurements
- PDF export handles mobile devices differently due to browser limitations