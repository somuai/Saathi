-- PostgreSQL schema for Saathi observatory.
-- Runtime on this MVP is JSONL (Render free disk). This file is the production target.

CREATE TABLE IF NOT EXISTS users (
  visitor_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,
  campaign TEXT,
  paid BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS avatars (
  avatar_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pal_id TEXT,
  model_version TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id TEXT PRIMARY KEY,
  visitor_id TEXT REFERENCES users (visitor_id),
  avatar_id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_s INTEGER,
  turns INTEGER,
  completed BOOLEAN,
  infra_failed BOOLEAN,
  provider TEXT
);

CREATE TABLE IF NOT EXISTS conversation_sessions (
  session_id TEXT PRIMARY KEY,
  conversation_id TEXT,
  visitor_id TEXT,
  started_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  conversation_id TEXT,
  role TEXT,
  -- Content is NOT stored in analytics. Operational copy is optional and off by default.
  stored BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS support_ratings (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT,
  ts TIMESTAMPTZ NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  duration_s INTEGER,
  turns INTEGER,
  avatar_id TEXT,
  model_version TEXT,
  conversation_id TEXT,
  source TEXT,
  infra_failed BOOLEAN,
  completed BOOLEAN
);

CREATE TABLE IF NOT EXISTS memories (
  memory_id TEXT PRIMARY KEY,
  user_id TEXT,
  subject TEXT,
  fact TEXT,
  source_conversation TEXT,
  source_message TEXT,
  timestamp TIMESTAMPTZ,
  confidence REAL,
  user_confirmed BOOLEAN,
  sensitive_data_category TEXT,
  deletion_status TEXT
);

CREATE TABLE IF NOT EXISTS memory_evidence (
  memory_id TEXT REFERENCES memories (memory_id),
  evidence_hash TEXT,
  PRIMARY KEY (memory_id, evidence_hash)
);

CREATE TABLE IF NOT EXISTS safety_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  category TEXT,
  severity TEXT
);

CREATE TABLE IF NOT EXISTS crisis_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  visitor_id TEXT,
  true_positive BOOLEAN,
  false_negative BOOLEAN
);

CREATE TABLE IF NOT EXISTS dependency_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  visitor_id TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS tavus_sessions (
  conversation_id TEXT PRIMARY KEY,
  created_ok BOOLEAN,
  latency_ms INTEGER,
  error_code TEXT
);

CREATE TABLE IF NOT EXISTS latency_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  conversation_id TEXT,
  stage TEXT,
  latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS ai_evaluations (
  id TEXT PRIMARY KEY,
  model_version TEXT,
  empathy REAL,
  relevance REAL,
  safety REAL,
  grounding REAL,
  emotional REAL
);

CREATE TABLE IF NOT EXISTS model_versions (
  model_version TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiments (
  experiment_id TEXT PRIMARY KEY,
  name TEXT,
  primary_metric TEXT
);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  visitor_id TEXT,
  experiment_id TEXT,
  variant TEXT,
  PRIMARY KEY (visitor_id, experiment_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  conversation_id TEXT,
  avatar_id TEXT,
  model_version TEXT,
  source TEXT,
  props JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  visitor_id TEXT PRIMARY KEY,
  status TEXT,
  mrr_usd REAL
);

CREATE TABLE IF NOT EXISTS privacy_requests (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT,
  kind TEXT,
  ts TIMESTAMPTZ NOT NULL,
  ok BOOLEAN
);

CREATE INDEX IF NOT EXISTS analytics_events_name_ts ON analytics_events (name, ts);
CREATE INDEX IF NOT EXISTS analytics_events_visitor ON analytics_events (visitor_id, ts);
CREATE INDEX IF NOT EXISTS support_ratings_ts ON support_ratings (ts);
CREATE INDEX IF NOT EXISTS safety_events_ts ON safety_events (ts);
