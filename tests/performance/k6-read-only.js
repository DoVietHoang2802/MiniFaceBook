import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'https://api.miniface.site/api').replace(/\/$/, '');
const testEmail = __ENV.TEST_EMAIL;
const testPassword = __ENV.TEST_PASSWORD;

export const options = {
  scenarios: {
    read_only: {
      executor: 'ramping-vus',
      stages: [
        { duration: '15s', target: Number(__ENV.LOAD_VUS || 5) },
        { duration: '30s', target: Number(__ENV.LOAD_VUS || 5) },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const health = http.get(`${baseUrl}/actuator/health`);
  check(health, { 'health endpoint is UP': (response) => response.status === 200 });

  if (!testEmail || !testPassword) {
    return { headers: null };
  }

  const login = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email: testEmail, password: testPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'test account login succeeds': (response) => response.status === 200 });

  const cookieHeader = Object.entries(login.cookies)
    .map(([name, cookies]) => `${name}=${cookies[0].value}`)
    .join('; ');
  return { headers: { Cookie: cookieHeader } };
}

export default function (data) {
  const health = http.get(`${baseUrl}/actuator/health`);
  check(health, { 'health is 200': (response) => response.status === 200 });

  if (data.headers) {
    const feed = http.get(`${baseUrl}/posts/newsfeed?page=0&size=10`, { headers: data.headers });
    check(feed, { 'newsfeed is 200': (response) => response.status === 200 });

    const search = http.get(`${baseUrl}/posts/search?q=miniface&page=0&size=10`, {
      headers: data.headers,
    });
    check(search, { 'post search is 200': (response) => response.status === 200 });
  }

  sleep(1);
}
