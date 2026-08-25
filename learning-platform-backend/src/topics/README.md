# Topics module

The structural curriculum: subjects, chapters, and topics, with optional prerequisite edges between topics. `AgentModule` uses a topic's identity to scope Qdrant retrieval; the adaptive engine uses prerequisite edges to route a learner when a coordinate demotes past the floor.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/topics/tree` | full subject/chapter/topic tree |
| POST | `/api/topics` | create a topic — **admin only** |
| GET | `/api/topics/:id/prerequisites` | a topic's prerequisite edges |
| PATCH | `/api/topics/:id` | update a topic — **admin only** |
| DELETE | `/api/topics/:id` | remove a topic — **admin only** |
