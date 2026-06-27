# Wemarket Coin Changelog

## 1.0.0 (2026-06-20)

### Added
- 통합 암호화폐 포트폴리오 대시보드
- 다중 거래소 연동 (CoinOne, Binance, Upbit, Bithumb 등 8개)
- 통합 포트폴리오 페이지 (자산 테이블, 파이차트, 상관관계 분석)
- 거래 내역 페이지
- FIRE(Financial Independence Retire Early) 시뮬레이터 (8대 기능)
- 세금 최적화 계산기 (양도소득세, 손익통산, 절세 전략)
- 맞춤형 복합 조건 알림 시스템 (CustomAlerts)
- 매매 일지 시스템 (TradeJournal)
- 이기종 자산 상관관계 분석
- AI 브리핑 위젯, 고래 알림, 리스크 점수

### Fixed
- Portfolio.tsx 유니코드 이스케이프 → 실제 한글 텍스트로 복원
- .gitignore 보안 강화 (.env, coverage/ 패턴 추가)

### Changed
- ESLint 설정 유지 보강
- Vitest 기반 테스트 프레임워크 도입 (utils 테스트)
- package.json test/lint/format 스크립트 추가
