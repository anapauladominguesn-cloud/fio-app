const { GoogleAuth } = require('google-auth-library');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { personImageB64, garmentImageB64 } = req.body;
  const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
  const LOCATION = 'us-central1';

  // Autentica com as credenciais do Google Cloud
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/virtual-try-on-001:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{
        person_image: { bytesBase64Encoded: personImageB64 },
        garment_image: { bytesBase64Encoded: garmentImageB64 }
      }],
      parameters: { sampleCount: 1 }
    })
  });

  const data = await response.json();
  const resultB64 = data?.predictions?.[0]?.bytesBase64Encoded;

  if (!resultB64) return res.status(500).json({ error: 'Try-on falhou' });
  res.status(200).json({ imageB64: resultB64 });
}
