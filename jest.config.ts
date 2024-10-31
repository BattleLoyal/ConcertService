module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$', // 테스트 파일 확장자 .spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest', // ts-jest를 사용하여 .ts 파일 컴파일
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1', // src를 절대 경로로 매핑
  },
};