export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.redirect(302, '/5-development-models');
  }

  const email = req.body.email;
  if (!email) {
    return res.redirect(302, '/5-development-models?error=1');
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: email,
        groups: ['183924441027184080']
      })
    });

    if (response.ok || response.status === 200 || response.status === 201) {
      return res.redirect(302, '/5-development-models?subscribed=1');
    } else {
      return res.redirect(302, '/5-development-models?error=1');
    }
  } catch (e) {
    return res.redirect(302, '/5-development-models?error=1');
  }
}
