import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [{ duration: '1m', target: 100 }],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://172.30.1.4:4000';

export default function () {
  const url = `${BASE_URL}/concert/1/date-nocache?date=2023-02-21`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      authorization: `UUIDTEST1`,
    },
  };

  const res = http.get(url, params);

  // 응답 상태 확인
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 부하를 주기 위해 잠시 대기
  sleep(1);
}
