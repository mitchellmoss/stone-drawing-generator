# Stone Mockup Generator

A web application for creating and exporting stone mockups for countertop fabrication and similar purposes. Built with Next.js and TypeScript.

![Stone Mockup Generator Screenshot](public/screenshot.png)

## Features

- **Create Stone Mockups**: Specify dimensions, material properties, and polished edges to generate visual mockups
- **Export Options**: Download as PNG or PDF
- **Multi-piece Support**: Save multiple stone pieces and export them together
- **Fraction Input**: Enter measurements as fractions (e.g., "2-1/2" or "3/4")
- **Notes**: Add specific notes to each stone piece
- **Local Storage**: Automatically saves your work in progress

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (7.x or later recommended)

### Installation

1. Ensure you have the correct Node.js version:
   ```bash
   # Using nvm (recommended)
   nvm install 18.17.0
   nvm use 18.17.0

   # Or check your current version
   node --version  # Should be v18.17.0 or higher
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Deployment**: Ready for Cloudflare deployment with Open Next.js

## Deployment

For Cloudflare deployment:

```bash
pnpm build:worker
pnpm preview
```

## Available Scripts

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application
- `pnpm start`: Start the production server
- `pnpm lint`: Lint the codebase
- `pnpm build:worker`: Build for Cloudflare
- `pnpm preview`: Preview with Cloudflare Wrangler
- `pnpm cf-typegen`: Generate Cloudflare type definitions

## Project Structure

- `/src/components/stone-generator`: Main components for stone mockup creation
- `/src/lib`: Utility functions for drawing, exporting, and fraction handling
- `/src/types`: TypeScript interfaces for the application
- `/src/hooks`: Custom React hooks including local storage persistence

## License

MIT