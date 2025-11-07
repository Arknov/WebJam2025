// api/maps-key.js
export default function handler(req, res) {
  // Return the API key stored in Vercel environment variable
  res.status(200).json({ key: process.env.key });
}