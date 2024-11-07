### 개선할 수 있는 로직 분석

### 예약 가능한 날짜 조회에 캐싱 적용

### 1. 분석

예약 가능한 날짜 조회는 콘서트와 날짜에 따라 예약 가능한 공연의 일정을 조회하는 기능입니다. 공연 일정은 자주 변경되지 않으므로, 캐싱을 적용하여 반복 조회 시, 데이터베이스 부하를 줄일 수 있습니다.

### 2. 적용 이유

- **데이터 변경 빈도 낮음**: 예약 가능한 날짜는 자주 변경되지 않습니다. 따라서 한 번 캐싱해두면, 다시 데이터베이스를 조회할 필요가 없습니다.
- **자주 조회되는 데이터**: 사용자들이 동일한 공연의 날짜 정보를 조회할 가능성이 크므로, 캐싱을 통해 조회하면 조회 성능이 좋습니다.

### 3. 캐싱 로직

- **캐시 키**: performances:${concertId}
- **캐시 데이터**: 특정 공연의 예약 가능한 날짜 리스트를 Hash 자료구조로 저장하며, 데이터베이스 조회 없이 빠르게 조회할 수 있습니다.
- **캐시 TTL**: 24시간 (하루), 일단 데이터가 자주 변경되지 않으므로 하루 주기로 갱신. 운영에 따라 TTL을 변경할 필요가 있다.
- **로직**:
    - 요청 시 Redis에서 키로 날짜 리스트를 조회한다.
    - 만약 캐시에 없으면 데이터베이스에서 조회 후, Redis 캐시에 저장하고 24시간 TTL 적용.

### 4. 성능 테스트

- 캐싱을 적용하지 않은 케이스
    - 1분 동안 100명의 사용자가 콘서트 하나의 예약 가능한 날짜를 조회한다.
        
        ![image](https://github.com/user-attachments/assets/fc2f0f07-3ada-40d7-9369-fcea39faf14d)
        

- 캐싱을 적용한 케이스
    - 1분 동안 100명의 사용자가 콘서트 하나의 예약 가능한 날짜를 조회한다.
 
        ![image](https://github.com/user-attachments/assets/81697e6b-ba5d-422b-a9ae-d92c850e29ad)


- 비교
    
    
    | 구분 | 평균 시간 | 최소 응답 | 최대 응답 | p95 |
    | --- | --- | --- | --- | --- |
    | 캐시 미적용 | 9.64ms | 0.90ms | 206.24ms | 34.32ms |
    | 캐시 적용 | 8.94ms | 2.24ms | 159.78ms | 17.48ms |
- 캐싱을 적용한 케이스의 평균 응답 시간이 1ms 정도 빠르다.
- 캐시를 적용한 쪽의 최대 응답 시간 및 95번째 백분위수 응답시간이 더 우수하기 때문에, 캐시를 적용하는 것이 더 좋은 성능을 가질 것이다.

### 예약 가능한 좌석 조회에 캐싱 적용

### 1. 기능 개요

예약 가능한 좌석 조회는 공연의 특정 날짜에 대해 예약 가능한 좌석을 조회하는 기능입니다. 좌석 정보는 실시간으로 변경될 가능성이 있으므로 캐싱을 적용하는 것이 좋은지 성능 테스트가 필요합니다.

### 2. 캐싱 적용 이유

- **빈번한 조회**: 좌석 조회는 사용자가 공연 예약 전 필수로 확인하는 데이터로, 높은 빈도로 조회될 가능성이 큽니다. 좌석 또한, 보통 100개 이상이 될 확률이 높기 때문에 빈번하면서 다건의 데이터를 조회해줘야 한다.
- **빠른 응답 필요**: 좌석 상태는 최대한 실제 데이터에 가까워야 하며, 빠른 응답이 중요합니다.

### 3. 캐싱 로직

- **캐시 키**: concert:${concertId}:date:${date}:seats
- **캐시 데이터**: 특정 공연 일자의 예약 가능한 좌석 번호 목록
- **캐시 TTL**: 5분, 실시간 좌석 정보와 유사하게 유지되기 위해 5분 간격으로 갱신
- **로직**:
    - 좌석 조회 시 Redis에서 concert:${concertId}:date:${date}:seats 키에 Hash 자료구조의 캐시 확인.
    - 캐시에 없으면 먼저 performanceId가 필요하므로 performances:${concertId}키로 캐시를 확인해서, 해당 날짜에 공연이 있는지 먼저 체크합니다. 데이터베이스에서 예약 가능한 상태의 좌석들을 조회합니다. 결과가 있다면 concert:${concertId}:date:${date}:seats키에 캐시를 추가합니다. 예약 가능한 좌석은 자주 변경되기 때문에 30초 이내의 만료시간을 가지도록 합니다.
    - 좌석 임시 예약 요청 발생 시에는 예약 가능한 상태가 아니기 때문에 해당 키의 Hash에서 해당 좌석번호를 삭제합니다.

### 4. 성능 테스트

- 캐싱을 적용하지 않은 케이스
    - 1분 동안 100명의 사용자가 특정 날짜의 공연에서 예약 가능한 좌석들을 조회한다.
        
        ![image](https://github.com/user-attachments/assets/8f784ac1-d9f8-44d0-bbcc-f64d121164dc)

        
- 캐싱을 적용한 케이스
    - 1분 동안 100명의 사용자가 특정 날짜의 공연에서 예약 가능한 좌석들을 조회한다.
        
        ![image](https://github.com/user-attachments/assets/a153f061-2b88-48d1-8a3b-4caee76f967e)

        
- 비교
    
    
    | 구분 | 평균 시간 | 최소 응답 | 최대 응답 | p95 |
    | --- | --- | --- | --- | --- |
    | 캐시 미적용 | 10.72ms | 1.01ms | 144.97ms | 25.3ms |
    | 캐시 적용 | 10.92ms | 1.94ms | 72.42ms | 21.55ms |
- 캐싱을 적용한 케이스와 미적용한 케이스의 차이점은 최대 응답과 p95 응답 시간이다.
- 캐시를 적용한 쪽의 최대 응답 시간 및 95번째 백분위수 응답시간이 더 우수하기 때문에, 캐시를 적용하는 것이 더 좋은 성능을 가질 것이다. 다만 평균 시간은 비슷하다.

### 5. 추가 성능 테스트

- **좌석 임시 예약**을 하면 좌석 상태가 변경되므로, 해당 API 까지 호출했을 때 캐시 적용 전과 후의 케이스를 좀 더 실제와 비슷하게 테스트할 수 있을 것이다.
- 좌석 번호 1부터 50까지 랜덤으로 유저들이 예약하는 케이스이다.
- 예약가능한 좌석 조회를 먼저 했을 때, 나온 응답에서 예약하려는 좌석 번호가 있을 경우에만 좌석 임시 예약 API를 호출한다.
- 캐시를 적용하지 않은 케이스
    - 1분 동안 100명의 유저가 랜덤한 좌석을 예약 시도한다.
    - 
       ![image](https://github.com/user-attachments/assets/d1d59e27-1522-42ac-b215-0051772339a0)

        
- 캐시를 적용한 케이스
    - 1분 동안 100명의 유저가 랜덤한 좌석을 예약 시도한다.

        ![image](https://github.com/user-attachments/assets/b6359dd4-905a-454a-a53c-72a23d8e47d0)


        
- 비교
    
    
    | 구분 | 평균 시간 | 최소 응답 | 최대 응답 | p95 |
    | --- | --- | --- | --- | --- |
    | 캐시 미적용 | 14.31ms | 913.7µs | 383.82ms | 35.74ms |
    | 캐시 적용 | 293.47ms | 4.66ms | 3.74s | 1.51s |
- 캐시를 적용하지 않은 것이 훨씬 성능이 좋았다.
- 예약 가능한 좌석이 있는지 조회하고 난 이후, 예약하려는 좌석이 목록이 있는 경우에만 좌석 예약을 진행했다.
- 따라서, 예약 가능한 좌석을 조회만 하는 경우에는 캐시를 적용한 것이 성능이 좋았으나 좌석 예약을 진행한 것은 좌석 상태가 변경될 때 캐시에서 삭제하는 등 캐시를 자주 관리해줘야 했기 때문에 성능이 좋지 않은 것으로 보인다.
- 캐시 만료 시간을 30초에서 1초로 변경하거나, 혹은 좌석 임시 예약 이후 해당 좌석을 캐시에서 삭제하지 않는 등 여러번 테스트를 진행하였으나 여전히 캐시를 미적용한 경우보다 훨씬 성능이 떨어졌기 때문에 결과적으로 좌석 임시 예약은 캐시 미적용을 사용할 것이다.