import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // 1분 동안 동시 사용자 100명까지 증가
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 요청이 500ms 이내에 처리되어야 함
    http_req_failed: ['rate<0.01'], // 실패율 1% 미만
  },
};

const BASE_URL = 'http://172.30.1.4:4000'; // API 서버 주소
const PERFORMANCE_ID = 1; // 테스트할 performanceId

export default function () {
  const url = `${BASE_URL}/concert/${PERFORMANCE_ID}/seat-nocache?date=2023-02-21`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'UUIDTEST1', // 인증 토큰
    },
  };

  const res = http.get(url, params);

  // 응답 상태 및 성능 확인
  check(res, {
    'status is 200': (r) => r.status === 200, // 상태 코드 200 확인
    'response time < 500ms': (r) => r.timings.duration < 500, // 응답 시간이 500ms 이하인지 확인
  });

  // 부하를 줄 때 요청 간 간격을 위해 대기
  sleep(1);
}
