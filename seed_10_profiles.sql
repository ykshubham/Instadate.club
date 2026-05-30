-- Clean up existing seeded users
DELETE FROM users WHERE id LIKE 'seeded_user_%';

-- Insert users
INSERT INTO users (id, email, full_name, age, instagram, city, whatsapp, gender, intent, weekend_status, bio, vibe, completed, avatar_url)
VALUES
('seeded_user_1', 'priyanka@instadate.club', 'Priyanka Sen', '23', '@priyanka_sen', 'Mumbai', '9876543210', 'Female', 'Dating', 'Looking for quiet book reading companion at a local Bandra cafe.', 'Specialty coffee lover, indie film enthusiast, and amateur film photographer. Let''s explore local book cafes.', 'Cafe Partner Vibe', 1, '/assets/member-photos/kavya-1.jpg'),
('seeded_user_2', 'kabir@instadate.club', 'Kabir Shah', '25', '@kabir_shah', 'Mumbai', '9876543211', 'Male', 'Dating', 'Early morning court pickleball matches, followed by a warm brunch.', 'Early stage founder, active tennis/pickleball player, and night-sky stargazer. Let''s build something and laugh.', 'Startup Founder Vibe', 1, '/assets/member-photos/zara-1.jpg'),
('seeded_user_3', 'ananya@instadate.club', 'Ananya Iyer', '22', '@ananya_iyer', 'Mumbai', '9876543212', 'Female', 'Friendship', 'Walking tour around old Colaba architecture, then iced matcha.', 'Modern art curator, jazz listener, and heritage walk lover. Collector of vintage magazines.', 'Art Gallery Vibe', 1, '/assets/member-photos/natasha-1.jpg'),
('seeded_user_4', 'dev@instadate.club', 'Dev Patel', '24', '@dev_patel', 'Mumbai', '9876543213', 'Male', 'Dating', 'Live acoustic sets at a cozy bar, then late coffee and a long walk.', 'Indie musician, gig photographer, and vinyl collector. Let''s find some live acoustic sets tonight.', 'Concert Vibe', 1, '/assets/member-photos/priya-1.jpg'),
('seeded_user_5', 'riya@instadate.club', 'Riya Sharma', '23', '@riya_sharma', 'Mumbai', '9876543214', 'Female', 'Dating', 'Sourdough tasting, cafe hopping in Bandra, and exchanging book lists.', 'Copywriter by day, baker by night. Obsessed with artisanal sourdough and cozy speakeasies.', 'Cafe Partner Vibe', 1, '/assets/member-photos/kavya-2.jpg'),
('seeded_user_6', 'aarav@instadate.club', 'Aarav Singhania', '25', '@aarav_singh', 'Mumbai', '9876543215', 'Male', 'Dating', 'Hiking early Saturday, then recovering with strong filter coffee.', 'Venture builder, fitness enthusiast, weekend hiker. Looking for someone ambitious yet kind.', 'Startup Founder Vibe', 1, '/assets/member-photos/zara-2.jpg'),
('seeded_user_7', 'ishaan@instadate.club', 'Ishaan Kapoor', '24', '@ishaan_k', 'Mumbai', '9876543216', 'Male', 'Friendship', 'Exploring hidden street food joints in South Mumbai on Sunday morning.', 'Backpack traveller, road-trip planner, and food explorer. 12 countries and counting.', 'Travel Buddy Vibe', 1, '/assets/member-photos/natasha-2.jpg'),
('seeded_user_8', 'meera@instadate.club', 'Meera Deshmukh', '22', '@meera_d', 'Mumbai', '9876543217', 'Female', 'Dating', 'Quiet afternoon museum walk, then hot tea and discussions.', 'Classical dancer, history student, museum lover. Let''s talk about ancient civilisations over tea.', 'Cafe Partner Vibe', 1, '/assets/member-photos/priya-2.jpg'),
('seeded_user_9', 'karan@instadate.club', 'Karan Talwar', '25', '@karan_t', 'Mumbai', '9876543218', 'Male', 'Dating', 'Standup comedy open mic show, then grabbing late night burgers.', 'Standup comedy fan, foodie, amateur chef. Making people laugh is my full-time hobby.', 'Concert Vibe', 1, '/assets/member-photos/kavya-1.jpg'),
('seeded_user_10', 'natasha@instadate.club', 'Natasha Sen', '24', '@natasha_s', 'Mumbai', '9876543219', 'Female', 'Dating', 'Pottery workshop, iced latte, and a slow walk through Bandra streets.', 'Graphic designer, pottery enthusiast, plant mother of twelve. Let''s paint something together.', 'Art Gallery Vibe', 1, '/assets/member-photos/zara-1.jpg');

-- Insert profiles
INSERT INTO profiles (user_id, full_name, age, instagram, city, whatsapp, gender, profession, college, intent, weekend_status, bio, vibe, plan, completed, profile_latitude, profile_longitude)
VALUES
('seeded_user_1', 'Priyanka Sen', '23', '@priyanka_sen', 'Mumbai', '9876543210', 'Female', 'Photographer', 'St. Xavier''s College', 'Dating', 'Looking for quiet book reading companion at a local Bandra cafe.', 'Specialty coffee lover, indie film enthusiast, and amateur film photographer. Let''s explore local book cafes.', 'Cafe Partner Vibe', 'Instadate Elite', 1, 19.0596, 72.8295),
('seeded_user_2', 'Kabir Shah', '25', '@kabir_shah', 'Mumbai', '9876543211', 'Male', 'Tech Founder', 'IIT Bombay', 'Dating', 'Early morning court pickleball matches, followed by a warm brunch.', 'Early stage founder, active tennis/pickleball player, and night-sky stargazer. Let''s build something and laugh.', 'Startup Founder Vibe', 'Instadate Elite', 1, 19.0825, 72.8270),
('seeded_user_3', 'Ananya Iyer', '22', '@ananya_iyer', 'Mumbai', '9876543212', 'Female', 'Art Curator', 'LS Raheja Fine Arts', 'Friendship', 'Walking tour around old Colaba architecture, then iced matcha.', 'Modern art curator, jazz listener, and heritage walk lover. Collector of vintage magazines.', 'Art Gallery Vibe', 'Instadate Plus', 1, 19.0540, 72.8315),
('seeded_user_4', 'Dev Patel', '24', '@dev_patel', 'Mumbai', '9876543213', 'Male', 'Indie Musician', 'NM College', 'Dating', 'Live acoustic sets at a cozy bar, then late coffee and a long walk.', 'Indie musician, gig photographer, and vinyl collector. Let''s find some live acoustic sets tonight.', 'Concert Vibe', 'Instadate Elite', 1, 19.0735, 72.8220),
('seeded_user_5', 'Riya Sharma', '23', '@riya_sharma', 'Mumbai', '9876543214', 'Female', 'Copywriter', 'Sophia College', 'Dating', 'Sourdough tasting, cafe hopping in Bandra, and exchanging book lists.', 'Copywriter by day, baker by night. Obsessed with artisanal sourdough and cozy speakeasies.', 'Cafe Partner Vibe', 'Instadate Elite', 1, 19.0620, 72.8230),
('seeded_user_6', 'Aarav Singhania', '25', '@aarav_singh', 'Mumbai', '9876543215', 'Male', 'Venture Builder', 'HR College', 'Dating', 'Hiking early Saturday, then recovering with strong filter coffee.', 'Venture builder, fitness enthusiast, weekend hiker. Looking for someone ambitious yet kind.', 'Startup Founder Vibe', 'Instadate Plus', 1, 19.0520, 72.8400),
('seeded_user_7', 'Ishaan Kapoor', '24', '@ishaan_k', 'Mumbai', '9876543216', 'Male', 'Travel Blogger', 'Symbiosis', 'Friendship', 'Exploring hidden street food joints in South Mumbai on Sunday morning.', 'Backpack traveller, road-trip planner, and food explorer. 12 countries and counting.', 'Travel Buddy Vibe', 'Instadate Plus', 1, 19.0700, 72.8350),
('seeded_user_8', 'Meera Deshmukh', '22', '@meera_d', 'Mumbai', '9876543217', 'Female', 'Research Scholar', 'St. Xavier''s College', 'Dating', 'Quiet afternoon museum walk, then hot tea and discussions.', 'Classical dancer, history student, museum lover. Let''s talk about ancient civilisations over tea.', 'Cafe Partner Vibe', 'Instadate Elite', 1, 19.0780, 72.8310),
('seeded_user_9', 'Karan Talwar', '25', '@karan_t', 'Mumbai', '9876543218', 'Male', 'Standup Comedian', 'Jai Hind College', 'Dating', 'Standup comedy open mic show, then grabbing late night burgers.', 'Standup comedy fan, foodie, amateur chef. Making people laugh is my full-time hobby.', 'Concert Vibe', 'Instadate Elite', 1, 19.0570, 72.8300),
('seeded_user_10', 'Natasha Sen', '24', '@natasha_s', 'Mumbai', '9876543219', 'Female', 'Graphic Designer', 'NID', 'Dating', 'Pottery workshop, iced latte, and a slow walk through Bandra streets.', 'Graphic designer, pottery enthusiast, plant mother of twelve. Let''s paint something together.', 'Art Gallery Vibe', 'Instadate Elite', 1, 19.0600, 72.8310);

-- Insert profile photos
INSERT INTO profile_photos (id, user_id, r2_key, url, content_type, size_bytes, position, is_primary)
VALUES
('photo_1_1', 'seeded_user_1', 'key_1_1', '/assets/member-photos/kavya-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_1_2', 'seeded_user_1', 'key_1_2', '/assets/member-photos/kavya-2.jpg', 'image/jpeg', 100000, 1, 0),
('photo_2_1', 'seeded_user_2', 'key_2_1', '/assets/member-photos/zara-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_2_2', 'seeded_user_2', 'key_2_2', '/assets/member-photos/zara-2.jpg', 'image/jpeg', 100000, 1, 0),
('photo_3_1', 'seeded_user_3', 'key_3_1', '/assets/member-photos/natasha-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_3_2', 'seeded_user_3', 'key_3_2', '/assets/member-photos/natasha-2.jpg', 'image/jpeg', 100000, 1, 0),
('photo_4_1', 'seeded_user_4', 'key_4_1', '/assets/member-photos/priya-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_4_2', 'seeded_user_4', 'key_4_2', '/assets/member-photos/priya-2.jpg', 'image/jpeg', 100000, 1, 0),
('photo_5_1', 'seeded_user_5', 'key_5_1', '/assets/member-photos/kavya-2.jpg', 'image/jpeg', 100000, 0, 1),
('photo_5_2', 'seeded_user_5', 'key_5_2', '/assets/member-photos/kavya-1.jpg', 'image/jpeg', 100000, 1, 0),
('photo_6_1', 'seeded_user_6', 'key_6_1', '/assets/member-photos/zara-2.jpg', 'image/jpeg', 100000, 0, 1),
('photo_6_2', 'seeded_user_6', 'key_6_2', '/assets/member-photos/zara-1.jpg', 'image/jpeg', 100000, 1, 0),
('photo_7_1', 'seeded_user_7', 'key_7_1', '/assets/member-photos/natasha-2.jpg', 'image/jpeg', 100000, 0, 1),
('photo_7_2', 'seeded_user_7', 'key_7_2', '/assets/member-photos/natasha-1.jpg', 'image/jpeg', 100000, 1, 0),
('photo_8_1', 'seeded_user_8', 'key_8_1', '/assets/member-photos/priya-2.jpg', 'image/jpeg', 100000, 0, 1),
('photo_8_2', 'seeded_user_8', 'key_8_2', '/assets/member-photos/priya-1.jpg', 'image/jpeg', 100000, 1, 0),
('photo_9_1', 'seeded_user_9', 'key_9_1', '/assets/member-photos/kavya-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_9_2', 'seeded_user_9', 'key_9_2', '/assets/member-photos/kavya-2.jpg', 'image/jpeg', 100000, 1, 0),
('photo_10_1', 'seeded_user_10', 'key_10_1', '/assets/member-photos/zara-1.jpg', 'image/jpeg', 100000, 0, 1),
('photo_10_2', 'seeded_user_10', 'key_10_2', '/assets/member-photos/zara-2.jpg', 'image/jpeg', 100000, 1, 0);

-- Insert trust metrics
INSERT OR REPLACE INTO trust_metrics (user_id, attendance_score, no_show_count, attended_count, verification_score, is_verified, response_rate, response_time_seconds, trust_score)
VALUES
('seeded_user_1', 98.0, 0, 12, 1.0, 1, 100.0, 120, 96.0),
('seeded_user_2', 96.0, 0, 8, 1.0, 1, 95.0, 300, 94.0),
('seeded_user_3', 100.0, 0, 4, 1.0, 1, 100.0, 60, 98.0),
('seeded_user_4', 94.0, 0, 15, 1.0, 1, 90.0, 600, 92.0),
('seeded_user_5', 98.0, 0, 6, 1.0, 1, 100.0, 180, 95.0),
('seeded_user_6', 92.0, 0, 20, 1.0, 1, 88.0, 900, 90.0),
('seeded_user_7', 95.0, 0, 11, 1.0, 1, 96.0, 240, 93.0),
('seeded_user_8', 100.0, 0, 7, 1.0, 1, 100.0, 90, 97.0),
('seeded_user_9', 90.0, 1, 14, 0.0, 0, 85.0, 1200, 82.0),
('seeded_user_10', 99.0, 0, 9, 1.0, 1, 100.0, 150, 96.0);

-- Insert user interests
INSERT OR REPLACE INTO user_interests (user_id, interest, weight)
VALUES
('seeded_user_1', 'Coffee', 5), ('seeded_user_1', 'Reading', 3), ('seeded_user_1', 'Photography', 3),
('seeded_user_2', 'Pickleball', 5), ('seeded_user_2', 'Brunch', 3), ('seeded_user_2', 'Tech', 3),
('seeded_user_3', 'Art', 5), ('seeded_user_3', 'Jazz', 5), ('seeded_user_3', 'Architecture', 3),
('seeded_user_4', 'Music', 5), ('seeded_user_4', 'Coffee', 3), ('seeded_user_4', 'Walking', 3),
('seeded_user_5', 'Baking', 5), ('seeded_user_5', 'Coffee', 5), ('seeded_user_5', 'Books', 3),
('seeded_user_6', 'Hiking', 5), ('seeded_user_6', 'Coffee', 3), ('seeded_user_6', 'Fitness', 3),
('seeded_user_7', 'Travel', 5), ('seeded_user_7', 'Food', 5), ('seeded_user_7', 'Roadtrips', 3),
('seeded_user_8', 'Dancing', 5), ('seeded_user_8', 'History', 5), ('seeded_user_8', 'Tea', 3),
('seeded_user_9', 'Comedy', 5), ('seeded_user_9', 'Burgers', 3), ('seeded_user_9', 'Food', 3),
('seeded_user_10', 'Pottery', 5), ('seeded_user_10', 'Coffee', 3), ('seeded_user_10', 'Design', 3);

-- Insert user intents
INSERT OR REPLACE INTO user_intents (user_id, intent)
VALUES
('seeded_user_1', 'Dating'),
('seeded_user_2', 'Dating'),
('seeded_user_3', 'Friendship'),
('seeded_user_4', 'Dating'),
('seeded_user_5', 'Dating'),
('seeded_user_6', 'Dating'),
('seeded_user_7', 'Friendship'),
('seeded_user_8', 'Dating'),
('seeded_user_9', 'Dating'),
('seeded_user_10', 'Dating');
