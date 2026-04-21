-- LPRA Database Schema
-- Drop existing tables if they exist (run this first to clean up)
DROP TABLE IF EXISTS song_ratings CASCADE;
DROP TABLE IF EXISTS album_reviews CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create albums table
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT UNIQUE NOT NULL, -- YouTube Music album ID
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  release_year INTEGER,
  genre TEXT,
  total_tracks INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create songs table (tracks within albums)
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  youtube_id TEXT UNIQUE NOT NULL, -- YouTube video ID for the song
  track_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, track_number)
);

-- Create song_ratings table (individual song ratings)
CREATE TABLE song_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Create album_reviews table (overall album reviews)
CREATE TABLE album_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  overall_rating DECIMAL(3,1) CHECK (overall_rating >= 0 AND overall_rating <= 10),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, album_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_albums_youtube_id ON albums(youtube_id);
CREATE INDEX idx_albums_artist ON albums(artist);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_songs_youtube_id ON songs(youtube_id);
CREATE INDEX idx_song_ratings_user_id ON song_ratings(user_id);
CREATE INDEX idx_song_ratings_song_id ON song_ratings(song_id);
CREATE INDEX idx_song_ratings_album_id ON song_ratings(album_id);
CREATE INDEX idx_album_reviews_user_id ON album_reviews(user_id);
CREATE INDEX idx_album_reviews_album_id ON album_reviews(album_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_song_ratings_updated_at BEFORE UPDATE ON song_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_album_reviews_updated_at BEFORE UPDATE ON album_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Albums: Everyone can read, only authenticated users can create
CREATE POLICY "Albums are viewable by everyone" ON albums
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create albums" ON albums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update albums" ON albums
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Songs: Everyone can read, only authenticated users can create
CREATE POLICY "Songs are viewable by everyone" ON songs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create songs" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Song Ratings: Users can read all, but only manage their own
CREATE POLICY "Song ratings are viewable by everyone" ON song_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own song ratings" ON song_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own song ratings" ON song_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own song ratings" ON song_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Album Reviews: Users can read all, but only manage their own
CREATE POLICY "Album reviews are viewable by everyone" ON album_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own album reviews" ON album_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own album reviews" ON album_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own album reviews" ON album_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create view for album statistics
CREATE OR REPLACE VIEW album_stats AS
SELECT 
  a.id as album_id,
  a.title,
  a.artist,
  COUNT(DISTINCT sr.user_id) as total_raters,
  AVG(sr.rating) as average_rating,
  COUNT(DISTINCT ar.id) as total_reviews
FROM albums a
LEFT JOIN song_ratings sr ON a.id = sr.album_id
LEFT JOIN album_reviews ar ON a.id = ar.album_id
GROUP BY a.id, a.title, a.artist;

-- Create view for user's album ratings (calculated from song ratings)
CREATE OR REPLACE VIEW user_album_ratings AS
SELECT 
  sr.user_id,
  sr.album_id,
  a.title as album_title,
  a.artist,
  AVG(sr.rating) as calculated_rating,
  COUNT(sr.id) as songs_rated,
  a.total_tracks
FROM song_ratings sr
JOIN albums a ON sr.album_id = a.id
GROUP BY sr.user_id, sr.album_id, a.title, a.artist, a.total_tracks;
