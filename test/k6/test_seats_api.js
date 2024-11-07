import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [{ duration: '1m', target: 100 }],
};

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'UUIDTEST-QUEUE:1';

// 캐시 적용 및 미적용 엔드포인트
const cacheUrl = `${BASE_URL}/concert/1/seat?date=2024-11-10`;
const noCacheUrl = `${BASE_URL}/concert/1/seat-nocache?date=2024-11-10`;

export default function () {
  const headers = {
    authorization: TOKEN,
  };

  // 캐시 적용 버전 요청
  // let resWithCache = http.get(cacheUrl, { headers });
  // check(resWithCache, {
  //   'with cache - status was 200': (r) => r.status === 200,
  //   'with cache - response time < 500ms': (r) => r.timings.duration < 500,
  // });

  // 캐시 미적용 버전 요청
  let resWithoutCache = http.get(noCacheUrl, { headers });
  check(resWithoutCache, {
    'without cache - status was 200': (r) => r.status === 200,
    'without cache - response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 요청 간격
  sleep(1);
}
