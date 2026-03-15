-- Exercises library
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  muscle_groups TEXT NOT NULL, -- JSON array e.g. ["chest","triceps"]
  created_at TEXT DEFAULT (datetime('now'))
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- ISO date e.g. "2024-03-15"
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tri-sets (group of 3 exercises)
CREATE TABLE IF NOT EXISTS trisets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- order within session
  created_at TEXT DEFAULT (datetime('now'))
);

-- Individual sets within a tri-set
CREATE TABLE IF NOT EXISTS triset_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  triset_id INTEGER NOT NULL REFERENCES trisets(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  position INTEGER NOT NULL, -- 1, 2, or 3
  weight_kg REAL, -- nullable
  reps INTEGER,
  sets INTEGER DEFAULT 1
);

-- Seed default exercises
INSERT OR IGNORE INTO exercises (name, muscle_groups) VALUES
  ('Wyciskanie sztangi na ławce', '["klatka piersiowa","triceps","barki"]'),
  ('Wyciskanie hantli na ławce', '["klatka piersiowa","triceps"]'),
  ('Rozpiętki', '["klatka piersiowa"]'),
  ('Martwy ciąg', '["plecy","pośladki","czworogłowe","dwugłowe uda"]'),
  ('Przysiad ze sztangą', '["czworogłowe","pośladki","dwugłowe uda"]'),
  ('Podciąganie', '["plecy","biceps"]'),
  ('Wiosłowanie sztangą', '["plecy","biceps"]'),
  ('Overhead press', '["barki","triceps"]'),
  ('Uginanie ramion ze sztangą', '["biceps"]'),
  ('Triceps pushdown', '["triceps"]'),
  ('Plank', '["core"]'),
  ('Leg press', '["czworogłowe","pośladki"]');
