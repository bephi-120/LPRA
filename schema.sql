-- ============================================
-- LPRA Database Schema (v2 - youtube_id as PK)
-- ============================================
-- Eliminá las tablas viejas primero
DROP VIEW IF EXISTS user_album_ratings CASCADE;
DROP VIEW IF EXISTS album_stats CASCADE;
DROP TABLE IF EXISTS song_ratings CASCADE;
DROP TABLE IF EXISTS album_reviews CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================
CREATE TABLE profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: albums
-- PK: youtube_id (ej: "MPREb_xxx", "OLAK5uy_xxx")
-- ============================================
CREATE TABLE albums (
  youtube_id      TEXT PRIMARY KEY,                  -- browseId de YouTube Music
  title           TEXT NOT NULL,
  artist          TEXT NOT NULL,
  cover_url       TEXT,
  release_year    INTEGER,
  genre           TEXT,
  total_tracks    INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: songs
-- PK: youtube_id (videoId, ej: "dQw4w9wgxcQ")
-- FK: album_youtube_id → albums.youtube_id
-- ============================================
CREATE TABLE songs (
  youtube_id        TEXT PRIMARY KEY,                -- videoId de YouTube
  album_youtube_id  TEXT REFERENCES albums(youtube_id) ON DELETE CASCADE NOT NULL,
  track_number      INTEGER NOT NULL,
  title             TEXT NOT NULL,
  duration_seconds  INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: song_ratings
-- Rating 0-10 por canción, por usuario
-- ============================================
CREATE TABLE song_ratings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  song_youtube_id  TEXT REFERENCES songs(youtube_id) ON DELETE CASCADE NOT NULL,
  album_youtube_id TEXT REFERENCES albums(youtube_id) ON DELETE CASCADE NOT NULL,
  rating           NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  review_text      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_youtube_id)
);

-- ============================================
-- TABLA: album_reviews
-- Reseña general del álbum (opcional, aparte del promedio)
-- ============================================
CREATE TABLE album_reviews (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  album_youtube_id TEXT REFERENCES albums(youtube_id) ON DELETE CASCADE NOT NULL,
  review_text      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, album_youtube_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_songs_album_youtube_id         ON songs(album_youtube_id);
CREATE INDEX idx_song_ratings_user_id           ON song_ratings(user_id);
CREATE INDEX idx_song_ratings_song_youtube_id   ON song_ratings(song_youtube_id);
CREATE INDEX idx_song_ratings_album_youtube_id  ON song_ratings(album_youtube_id);
CREATE INDEX idx_album_reviews_user_id          ON album_reviews(user_id);
CREATE INDEX idx_album_reviews_album_youtube_id ON album_reviews(album_youtube_id);

-- ============================================
-- FUNCIÓN Y TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_song_ratings_updated_at
  BEFORE UPDATE ON song_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_album_reviews_updated_at
  BEFORE UPDATE ON album_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums        ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_ratings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_reviews ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: lectura publica"       ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles: insertar el propio"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: actualizar el propio"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- albums (lectura pública, escritura solo autenticados)
CREATE POLICY "albums: lectura publica"         ON albums FOR SELECT USING (true);
CREATE POLICY "albums: insertar autenticado"    ON albums FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "albums: actualizar autenticado"  ON albums FOR UPDATE USING (auth.role() = 'authenticated');

-- songs (igual que albums)
CREATE POLICY "songs: lectura publica"          ON songs FOR SELECT USING (true);
CREATE POLICY "songs: insertar autenticado"     ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- song_ratings (el usuario solo gestiona los suyos)
CREATE POLICY "song_ratings: lectura publica"   ON song_ratings FOR SELECT USING (true);
CREATE POLICY "song_ratings: insertar propio"   ON song_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "song_ratings: actualizar propio" ON song_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "song_ratings: eliminar propio"   ON song_ratings FOR DELETE USING (auth.uid() = user_id);

-- album_reviews (igual)
CREATE POLICY "album_reviews: lectura publica"   ON album_reviews FOR SELECT USING (true);
CREATE POLICY "album_reviews: insertar propio"   ON album_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "album_reviews: actualizar propio" ON album_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "album_reviews: eliminar propio"   ON album_reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VISTA: album_stats (estadísticas globales por álbum)
-- ============================================
CREATE OR REPLACE VIEW album_stats AS
SELECT
  a.youtube_id                            AS album_youtube_id,
  a.title,
  a.artist,
  COUNT(DISTINCT sr.user_id)              AS total_raters,
  ROUND(AVG(sr.rating)::NUMERIC, 2)       AS average_rating,
  COUNT(DISTINCT ar.id)                   AS total_reviews
FROM albums a
LEFT JOIN song_ratings  sr ON a.youtube_id = sr.album_youtube_id
LEFT JOIN album_reviews ar ON a.youtube_id = ar.album_youtube_id
GROUP BY a.youtube_id, a.title, a.artist;

-- ============================================
-- VISTA: user_album_ratings (promedio por usuario, calculado de las canciones)
-- ============================================
CREATE OR REPLACE VIEW user_album_ratings AS
SELECT
  sr.user_id,
  sr.album_youtube_id,
  a.title                                 AS album_title,
  a.artist,
  ROUND(AVG(sr.rating)::NUMERIC, 2)       AS calculated_rating,
  COUNT(sr.id)                            AS songs_rated,
  a.total_tracks
FROM song_ratings sr
JOIN albums a ON sr.album_youtube_id = a.youtube_id
GROUP BY sr.user_id, sr.album_youtube_id, a.title, a.artist, a.total_tracks;
