// Course / framework registry. Add new groups here.
const COURSES = {
  models: { group: '183924441027184080', redirect: '/5-development-models' },
  voice:  { group: '184737667850700274', redirect: '/build-your-public-voice' },
  amf:    { group: '185546911183275136', redirect: '/resources' },
  ccm:    { group: '185546914392966331', redirect: '/resources' },
  cpg:    { group: '185800853427324705', redirect: '/resources' }
};

const DEFAULT_COURSE = 'models';

function wantsJSON(req) {
  const accept = (req.headers && (req.headers.accept || req.headers.Accept)) || '';
  return accept.indexOf('application/json') !== -1;
}

export default async function handler(req, res) {
  const body = req.body || {};
  const courseKey = body.course || DEFAULT_COURSE;
  const course = COURSES[courseKey] || COURSES[DEFAULT_COURSE];
  const json = wantsJSON(req);

  if (req.method !== 'POST') {
    if (json) return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return res.redirect(302, course.redirect);
  }

  const email = body.email;
  if (!email) {
    if (json) return res.status(400).json({ ok: false, error: 'email_required' });
    return res.redirect(302, `${course.redirect}?error=1`);
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
        groups: [course.group]
      })
    });

    if (response.ok || response.status === 200 || response.status === 201) {
      if (json) return res.status(200).json({ ok: true });
      return res.redirect(302, `${course.redirect}?subscribed=1`);
    }
    if (json) return res.status(502).json({ ok: false, error: 'subscribe_failed' });
    return res.redirect(302, `${course.redirect}?error=1`);
  } catch (e) {
    if (json) return res.status(500).json({ ok: false, error: 'server_error' });
    return res.redirect(302, `${course.redirect}?error=1`);
  }
}
