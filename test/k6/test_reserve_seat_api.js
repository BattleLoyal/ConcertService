import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export let options = {
  stages: [{ duration: '1m', target: 100 }],
};

// Load tokens from a JSON file
const tokens = new SharedArray('tokens', function () {
  return JSON.parse(open('./tokens.json'));
});

const BASE_URL = 'http://localhost:3000';

// 캐시 적용 및 미적용 엔드포인트
// 캐시 미적용
const noCacheUrl = `${BASE_URL}/concert/1/reserve-seat`;
const seatNoCacheUrl = `${BASE_URL}/concert/1/seat-nocache?date=2024-11-10`;

// 캐시 적용
const cacheUrl = `${BASE_URL}/concert/1/reserve-seat-cache`;
const seatCacheUrl = `${BASE_URL}/concert/1/seat?date=2024-11-10`;

export default function () {
  // Randomly select a seat number between 1 and 50
  const seatNumber = Math.floor(Math.random() * 50) + 1;
  const payload = JSON.stringify({
    seatNumber: seatNumber,
    date: '2024-11-10',
  });

  // Randomly select a token from the pool
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  const params = {
    headers: {
      'Content-Type': 'application/json',
      authorization: token,
    },
  };

  // 캐시 미적용
  // let seatStatusRes = http.get(seatNoCacheUrl, params);
  // check(seatStatusRes, {
  //   'seat status - status was 200': (r) => r.status === 200,
  // });
  //
  // const reservableSeats = seatStatusRes.json().availableSeats;
  //
  // if (reservableSeats.includes(seatNumber)) {
  //   // 캐시 미적용 버전 요청
  //   let resWithoutCache = http.post(noCacheUrl, payload, params);
  //   check(resWithoutCache, {
  //     'without cache - status was 200': (r) => r.status === 200,
  //     'without cache - response time < 500ms': (r) => r.timings.duration < 500,
  //   });
  // }

  // 캐시 적용
  let seatStatusRes = http.get(seatCacheUrl, params);
  check(seatStatusRes, {
    'seat status - status was 200': (r) => r.status === 200,
  });

  const reservableSeats = seatStatusRes.json().availableSeats;

  if (reservableSeats.includes(seatNumber)) {
    // 캐시 적용 버전 요청
    let resCache = http.post(cacheUrl, payload, params);
    check(resCache, {
      'cache - status was 200': (r) => r.status === 200,
      'cache - response time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  // 요청 간격
  sleep(1);
}
