# NearCart Frontend

Responsive web frontend for the NearCart storefront.

## Stack

- Vite
- React
- TypeScript
- React Router
- Tailwind CSS
- Axios

## Local development

The frontend is expected to run on port `5173`.

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

## Backend connection

The frontend talks only to the NearCart main backend.

Default API base URL:

```bash
http://127.0.0.1:5002/api
```

Set it with `VITE_API_BASE_URL` if needed.

## Main routes

- `/`
- `/shops`
- `/shops/:shopId`
- `/cart`
- `/checkout`
- `/orders`

## Verification

- Homepage shows backend connection status from `/api/health`
- Tailwind utilities drive the UI styling
- Placeholder routes are ready for later business logic
