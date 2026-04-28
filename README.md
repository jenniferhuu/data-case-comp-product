### Overview

PhilanthroGlobe maps the full architecture of global aid and philanthropic disbursements onto a live, interactive 3D globe. Users can filter by donor, sector, and recipient country to trace funding corridors in real time, from the Gates Foundation's health grants to cross-border climate commitments across 134 countries.
The platform surfaces patterns that spreadsheets can't: which corridors carry the most volume, how disbursements differ from commitments, and where the operational gaps in global philanthropy actually live.

##  Deployment

The dashboard is live at **[data-case-comp-product.vercel.app](https://data-case-comp-product.vercel.app)**.

### Deploy Your Own

This project is built with [Next.js](https://nextjs.org) and deployed via [Vercel](https://vercel.com).

#### Prerequisites
- Node.js 18+
- npm

#### Local Development

```bash
# Clone the repo
git clone https://github.com/jenniferhuu/data-case-comp-product.git
cd data-case-comp-product

# Install dependencies
npm install

# Run the data pipeline (processes raw data files)
npm run pipeline

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build

```bash
npm run build   # runs the pipeline + Next.js build
npm run start   # serves the production build locally
```

#### Deploy to Vercel

The easiest way to deploy is via the [Vercel platform](https://vercel.com/new):

1. Push your changes to GitHub
2. Import the repository on Vercel
3. Vercel will auto-detect Next.js and configure the build — no extra setup needed
4. Every push to `master` triggers an automatic redeploy

