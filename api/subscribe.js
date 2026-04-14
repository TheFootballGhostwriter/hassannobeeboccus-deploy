// Course registry. Add new EECs here.
const COURSES = {
  models: {
    group: '183924441027184080',
    redirect: '/5-development-models'
  },
  voice: {
    group: '184737667850700274',
    redirect: '/build-your-public-voice'
  }
};

const DEFAULT_COURSE = 'models';

export default async function handler(req, res) {
  const courseKey = (req.body && req.body.course) || DEFAULT_COURSE;
  const course = COURSES[courseKey] || COURSES[DEFAULT_COURSE];

  if (req.method !== 'POST') {
    return res.redirect(302, course.redirect);
  }

  const email = req.body.email;
  if (!email) {
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
      return res.redirect(302, `${course.redirect}?subscribed=1`);
    } else {
      return res.redirect(302, `${course.redirect}?error=1`);
    }
  } catch (e) {
    return res.redirect(302, `${course.redirect}?error=1`);
  }
}
