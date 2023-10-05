This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setting firebase environment

Create a `.env` file in the `next-web` root directory and add your Firebase configuration files. It should look like this:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=analytic-id
```

## Setting API host

Open `.env` file created above, add your api host in the file. It should look like this

```bash
# for example http://127.0.0.1:8000
API_HOST=your-api-host
NEXT_PUBLIC_API_HOST=your-api-host
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
