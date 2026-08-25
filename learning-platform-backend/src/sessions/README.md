# Sessions module

Projects adaptive learner state (`LearningTopicState`) into the Journey/Curriculum UI — locked, active, or completed per topic, joined against the published question catalog. The adaptive state is the sole progress source.

`test-session.entity.ts` is a legacy entity kept only for schema compatibility; it is deliberately not consulted by this module.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/sessions/journey` | topic tree with per-topic journey state |
