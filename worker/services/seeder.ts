import { D1Database } from '@cloudflare/workers-types';

export async function seedDatabaseIfEmpty(db: D1Database, env: any) {
  // 1. Strict Environment Protection Checks
  if (env?.ENVIRONMENT === 'production' || env?.NODE_ENV === 'production') {
    console.log('Instadate Seeder: Production detected. Skipping seeding to protect production data.');
    return;
  }

  // 2. Check if DATABASE_EMPTY or auto-seeding is allowed
  const shouldSeed = env?.DATABASE_EMPTY === 'true' || env?.DATABASE_EMPTY === true || env?.DATABASE_EMPTY === 1;
  if (!shouldSeed) {
    console.log('Instadate Seeder: DATABASE_EMPTY is not enabled. Skipping auto-seeding.');
    return;
  }

  // 3. Double-check if real/non-seeded users exist to protect existing data
  const realUsers = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE id NOT LIKE 'seeded_user_%' AND auth_provider != 'system'"
  ).first<{ count: number }>();

  if (realUsers && realUsers.count > 0) {
    console.log(`Instadate Seeder: Found ${realUsers.count} existing real users. Aborting seeding to prevent data corruption.`);
    return;
  }

  // 4. Check if seeded users are already populated
  const seededUsers = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE id LIKE 'seeded_user_%'"
  ).first<{ count: number }>();

  const eventsCount = await db.prepare("SELECT COUNT(*) as count FROM events").first<{ count: number }>();
  if (seededUsers && seededUsers.count >= 10 && eventsCount && eventsCount.count >= 5) {
    console.log('Instadate Seeder: Seed profiles and events already fully populated. Skipping execution.');
    return;
  }

  console.log('Instadate Seeder: Beginning database-driven development auto-seeding...');

  // Start Transaction Seeding
  try {
    // A. Clean up any partial seeds to ensure clean state
    await db.prepare("DELETE FROM profile_photos WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM trust_metrics WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM user_interests WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM user_intents WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM user_preferences WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM profiles WHERE user_id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM users WHERE id LIKE 'seeded_user_%'").run();
    await db.prepare("DELETE FROM events WHERE id LIKE 'seeded_event_%'").run();
    await db.prepare("DELETE FROM event_attendees WHERE event_id LIKE 'seeded_event_%'").run();
    await db.prepare("DELETE FROM event_feedback WHERE event_id LIKE 'seeded_event_%'").run();
    await db.prepare("DELETE FROM match_outcomes WHERE id LIKE 'seeded_outcome_%'").run();
    await db.prepare("DELETE FROM meetup_feedback WHERE id LIKE 'seeded_feedback_%'").run();
    await db.prepare("DELETE FROM chats WHERE slug LIKE 'seeded-chat-%'").run();
    await db.prepare("DELETE FROM chat_messages WHERE chat_id LIKE 'chat-seeded-%'").run();
    await db.prepare("DELETE FROM instant_plans WHERE id LIKE 'seeded_plan_%'").run();
    await db.prepare("DELETE FROM instant_plan_members WHERE plan_id LIKE 'seeded_plan_%'").run();
    await db.prepare("DELETE FROM analytics_events WHERE seed_data = 1").run();

    // B. Insert 10 complete Seed Users (8 Females, 2 Males) across diverse Indian cities
    const users = [
      {
        id: 'seeded_user_1',
        email: 'priyanka@instadate.club',
        name: 'Priyanka Sen',
        age: 23,
        instagram: '@priyanka_sen',
        city: 'Mumbai',
        gender: 'Female',
        profession: 'Specialty Coffee Roaster',
        college: 'St. Xavier\'s College, Mumbai',
        intent: 'Dating',
        weekend_status: 'Hosting a slow-brew tasting, cafe hopping in Bandra, and looking for warm conversations.',
        bio: 'Specialty coffee roaster, indie film enthusiast, and amateur film photographer. Let\'s explore local book cafes and talk about life.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/kavya-1.jpg',
        completion: 1,
        lat: 19.0596,
        lon: 72.8295,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_2',
        email: 'kabir@instadate.club',
        name: 'Kabir Shah',
        age: 25,
        instagram: '@kabir_shah',
        city: 'Mumbai',
        gender: 'Male',
        profession: 'Early-stage Startup Founder',
        college: 'IIT Bombay',
        intent: 'Dating',
        weekend_status: 'Early morning court pickleball matches at Bandra, followed by a hearty recovery brunch.',
        bio: 'Tech founder, active tennis/pickleball player, and night-sky stargazer. Let\'s build something, play a court game, and share a laugh.',
        vibe: 'Startup Founder Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 19.0825,
        lon: 72.8270,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_3',
        email: 'ananya@instadate.club',
        name: 'Ananya Iyer',
        age: 22,
        instagram: '@ananya_iyer',
        city: 'Surat',
        gender: 'Female',
        profession: 'Modern Art Curator',
        college: 'LS Raheja Fine Arts',
        intent: 'Friendship',
        weekend_status: 'Art gallery walkthroughs, sketch booking by the river, followed by authentic Gujarati Thali.',
        bio: 'Modern art curator, indie jazz listener, and heritage walk lover. I collect vintage postcards and love finding hidden local aesthetic spots.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/natasha-1.jpg',
        completion: 1,
        lat: 21.1702,
        lon: 72.8311,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_4',
        email: 'dev@instadate.club',
        name: 'Dev Patel',
        age: 24,
        instagram: '@dev_patel',
        city: 'Bangalore',
        gender: 'Male',
        profession: 'Indie Musician & Vinyl DJ',
        college: 'NMIMS Bangalore',
        intent: 'Dating',
        weekend_status: 'Setting up an ambient live acoustic set at a cozy Indiranagar lounge, then late night filter coffee.',
        bio: 'Indie musician, gig photographer, and vinyl collector. Let\'s find some live acoustic sets tonight and talk about our value systems.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 12.9716,
        lon: 77.5946,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_5',
        email: 'riya@instadate.club',
        name: 'Riya Sharma',
        age: 23,
        instagram: '@riya_sharma',
        city: 'Ahmedabad',
        gender: 'Female',
        profession: 'Boutique Branding Lead',
        college: 'NID Ahmedabad',
        intent: 'Dating',
        weekend_status: 'Artisanal sourdough baking workshops, visiting heritage stepwells, and exchanging book lists.',
        bio: 'Brand designer by day, home baker by night. Obsessed with architectural history, specialty lattes, and deep values conversation.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/kavya-2.jpg',
        completion: 1,
        lat: 23.0225,
        lon: 72.5714,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_6',
        email: 'meera@instadate.club',
        name: 'Meera Deshmukh',
        age: 22,
        instagram: '@meera_d',
        city: 'Pune',
        gender: 'Female',
        profession: 'Public Policy Researcher',
        college: 'Fergusson College, Pune',
        intent: 'Dating',
        weekend_status: 'Historical fort trekking on Saturday morning, followed by a warm cup of filter coffee.',
        bio: 'Classical dancer, history student, policy geek. Let\'s talk about heritage restoration and urban planning over strong tea.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 18.5204,
        lon: 73.8567,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_7',
        email: 'natasha@instadate.club',
        name: 'Natasha Sen',
        age: 24,
        instagram: '@natasha_s',
        city: 'Bangalore',
        gender: 'Female',
        profession: 'UI/UX Graphic Designer',
        college: 'NID Bangalore',
        intent: 'Dating',
        weekend_status: 'Clay pottery workshop, discovering indie bookstore cafes, and late night strolls in Cubbon Park.',
        bio: 'Graphic designer, clay sculptor, and full-time plant mother. Let\'s grab an iced lavender latte and paint custom canvases together.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 12.9724,
        lon: 77.5930,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_8',
        email: 'divya@instadate.club',
        name: 'Divya Nair',
        age: 22,
        instagram: '@divya_nair',
        city: 'Vadodara',
        gender: 'Female',
        profession: 'Classical Bharatanatyam Instructor',
        college: 'MS University Fine Arts',
        intent: 'Friendship',
        weekend_status: 'Teaching a beginner session of mudras, then seeking beautiful architecture landmarks in Vadodara.',
        bio: 'Classical dancer, artist, and tea collector. I love heritage walks, traditional textile block prints, and meaningful quiet evenings.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/natasha-2.jpg',
        completion: 1,
        lat: 22.3072,
        lon: 73.1812,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_9',
        email: 'kavya@instadate.club',
        name: 'Kavya Sharma',
        age: 22,
        instagram: '@kavya_sharma',
        city: 'Mumbai',
        gender: 'Female',
        profession: 'Acoustic Indie Vocalist',
        college: 'Sophia College, Mumbai',
        intent: 'Dating',
        weekend_status: 'Quiet Sunday sunset guitar session at Marine Drive, looking for vintage vinyl collection swaps.',
        bio: 'Vocalist, music composer, and slow-living advocate. Looking for a respectful, safety-verified partner who values honest talks.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/kavya-1.jpg',
        completion: 1,
        lat: 19.0760,
        lon: 72.8777,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_10',
        email: 'zara@instadate.club',
        name: 'Zara Chen',
        age: 23,
        instagram: '@zara_chen',
        city: 'Bangalore',
        gender: 'Female',
        profession: 'Sustainable Architect',
        college: 'RV College of Architecture',
        intent: 'Dating',
        weekend_status: 'Scouting local eco-resorts, mapping heritage bungalows, and drinking organic local matcha.',
        bio: 'Sustainable designer, vintage collector, and outdoor trekker. Let\'s search for hidden vintage bookstores and read next to each other.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 12.9800,
        lon: 77.6000,
        verification_level: 'highly_verified'
      }
    ];

    // C. Write user, profile, photo records securely
    for (const u of users) {
      await db.prepare(`
        INSERT INTO users (id, email, full_name, auth_provider, completed, avatar_url, seed_data)
        VALUES (?, ?, ?, 'google', ?, ?, 1)
      `).bind(u.id, u.email, u.name, u.completion, u.avatar_url).run();

      await db.prepare(`
        INSERT INTO profiles (
          user_id, full_name, age, instagram, city, whatsapp, gender, profession, college,
          intent, weekend_status, bio, vibe, plan, completed, profile_latitude, profile_longitude,
          phone_verified, instagram_verified, profile_verified, verification_level, seed_data
        ) VALUES (?, ?, ?, ?, ?, '9876543210', ?, ?, ?, ?, ?, ?, ?, 'Instadate Elite', ?, ?, ?, 1, 1, 1, ?, 1)
      `).bind(
        u.id, u.name, u.age.toString(), u.instagram, u.city, u.gender, u.profession, u.college,
        u.intent, u.weekend_status, u.bio, u.vibe, u.completion, u.lat, u.lon, u.verification_level
      ).run();

      // D. Insert 4-6 high quality profile photos per user
      const photos = [
        u.avatar_url,
        u.avatar_url.includes('kavya') ? '/assets/member-photos/kavya-2.jpg' :
        u.avatar_url.includes('zara') ? '/assets/member-photos/zara-1.jpg' :
        u.avatar_url.includes('natasha') ? '/assets/member-photos/natasha-2.jpg' :
        '/assets/member-photos/priya-2.jpg',
        '/assets/member-photos/priya-1.jpg',
        '/assets/member-photos/kavya-1.jpg',
        '/assets/member-photos/zara-2.jpg'
      ];

      for (let i = 0; i < photos.length; i++) {
        await db.prepare(`
          INSERT INTO profile_photos (id, user_id, r2_key, url, content_type, size_bytes, position, is_primary)
          VALUES (?, ?, ?, ?, 'image/jpeg', 100000, ?, ?)
        `).bind(`seeded_photo_${u.id}_${i}`, u.id, `key_${u.id}_${i}`, photos[i], i, i === 0 ? 1 : 0).run();
      }

      // E. Initialize robust trust metrics
      const attendance = u.id === 'seeded_user_9' ? 92.0 : 98.0;
      const noShow = u.id === 'seeded_user_9' ? 1 : 0;
      const attended = u.id === 'seeded_user_9' ? 12 : 15;
      const trustScore = u.id === 'seeded_user_9' ? 90.0 : 96.0;

      await db.prepare(`
        INSERT OR REPLACE INTO trust_metrics (user_id, attendance_score, no_show_count, attended_count, verification_score, is_verified, response_rate, response_time_seconds, trust_score)
        VALUES (?, ?, ?, ?, 100.0, 1, 100.0, 120, ?)
      `).bind(u.id, attendance, noShow, attended, trustScore).run();

      // F. Populate user interests
      const interests = ['Coffee', 'Books', 'Photography', 'Jazz', 'Treks', 'Pottery'];
      for (const weight of [5, 3]) {
        await db.prepare(`
          INSERT OR REPLACE INTO user_interests (user_id, interest, weight)
          VALUES (?, ?, ?)
        `).bind(u.id, interests[weight], weight).run();
      }

      // G. Populate user intents
      await db.prepare(`
        INSERT OR REPLACE INTO user_intents (user_id, intent)
        VALUES (?, ?)
      `).bind(u.id, u.intent).run();

      // H. Populate preferences
      await db.prepare(`
        INSERT OR REPLACE INTO user_preferences (user_id, preferred_gender, min_age, max_age, preferred_distance_km)
        VALUES (?, 'All', 18, 40, 50.0)
      `).bind(u.id).run();
    }

    // I. Seed 2 Social Events
    const socialEvents = [
      {
        id: 'seeded_event_social_1',
        host: 'seeded_user_1',
        title: 'Bandra Slow-Brew Coffee Meetup',
        type: 'Social',
        desc: 'Join a curated afternoon focusing on single-origin pour overs, slow-living architecture, and deep value connections with verified speakeasy daters.',
        location: 'Aether Lounge, Bandra West',
        display_date: 'Saturday, June 6th',
        display_time: '4:00 PM onwards',
        image: '/assets/bandra_acoustic_mixer.png',
        capacity: 12,
        entry: 'Paid',
        price: '₹450',
        approval: 'Curated Invite'
      },
      {
        id: 'seeded_event_social_2',
        host: 'seeded_user_2',
        title: 'Sunday Morning Pickleball Social',
        type: 'Social',
        desc: 'Kick off your Sunday with healthy competition. All skill levels welcome for active doubles play, followed by authentic South Indian filter coffee.',
        location: 'Willingdon Gymkhana, Santacruz',
        display_date: 'Sunday, June 7th',
        display_time: '7:30 AM onwards',
        image: '/assets/aesthetic_date_spot.png',
        capacity: 16,
        entry: 'Free',
        price: null,
        approval: 'Auto-Approved'
      }
    ];

    for (const ev of socialEvents) {
      await db.prepare(`
        INSERT INTO events (
          id, host_user_id, type, title, description, location, display_date, raw_date,
          display_time, image, status, capacity, entry_type, price, approval_type, source, seed_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 'hosted', 1)
      `).bind(
        ev.id, ev.host, ev.type, ev.title, ev.desc, ev.location, ev.display_date,
        new Date().toISOString(), ev.display_time, ev.image, ev.capacity, ev.entry, ev.price, ev.approval
      ).run();

      // Social RSVPs
      const attendees = ['seeded_user_3', 'seeded_user_4', 'seeded_user_5', 'seeded_user_6', 'seeded_user_7', 'seeded_user_8'];
      for (const att of attendees) {
        await db.prepare(`
          INSERT INTO event_attendees (event_id, user_id, status)
          VALUES (?, ?, 'joined')
        `).bind(ev.id, att).run();

        // Feedbacks/Ratings to give realistic quality
        await db.prepare(`
          INSERT INTO event_feedback (id, event_id, user_id, rating, host_rating, would_attend_again, feedback)
          VALUES (?, ?, ?, 5, 5, 1, 'Incredible setup. Felt premium, secure, and authentic.')
        `).bind(`seeded_feedback_${ev.id}_${att}`, ev.id, att).run();
      }
    }

    // J. Seed 3 Party Events
    const partyEvents = [
      {
        id: 'seeded_event_party_1',
        host: 'seeded_user_6',
        title: 'Sunset Skyline Rooftop Mixer',
        type: 'Party',
        desc: 'Unwind at golden hour overlooking the Colaba skyline. Features signature dynamic mocktails, smooth ambient deep house, and verified introductions.',
        location: 'Bayview Rooftop, Colaba',
        display_date: 'Saturday, June 13th',
        display_time: '6:30 PM onwards',
        image: '/assets/mumbai_rooftop_mixer.png',
        capacity: 35,
        entry: 'Paid',
        price: '₹1200',
        approval: 'Highly Vibe Checked'
      },
      {
        id: 'seeded_event_party_2',
        host: 'seeded_user_4',
        title: 'Secret Speakeasy House Mixer',
        type: 'Party',
        desc: 'An intimate cozy gathering in a private Colaba design loft. Exquisite vinyl records, curated board games, and home-style sourdough pairings.',
        location: 'The Design Loft, Colaba',
        display_date: 'Saturday, June 20th',
        display_time: '8:00 PM onwards',
        image: '/assets/colaba_speakeasy.png',
        capacity: 20,
        entry: 'Paid',
        price: '₹800',
        approval: 'Invite Only'
      },
      {
        id: 'seeded_event_party_3',
        host: 'seeded_user_9',
        title: 'Live Acoustic & Jazz Social',
        type: 'Party',
        desc: 'Experience pure musical chemistry. Live unplugged sets, candlelit ambiance, and high-value matches interacting without generic dating pressures.',
        location: 'The Blue Room, Bandra',
        display_date: 'Friday, June 26th',
        display_time: '8:30 PM onwards',
        image: '/assets/rooftop_sunset_soiree.png',
        capacity: 25,
        entry: 'Paid',
        price: '₹600',
        approval: 'Verified Status Required'
      }
    ];

    for (const ev of partyEvents) {
      await db.prepare(`
        INSERT INTO events (
          id, host_user_id, type, title, description, location, display_date, raw_date,
          display_time, image, status, capacity, entry_type, price, approval_type, source, seed_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 'hosted', 1)
      `).bind(
        ev.id, ev.host, ev.type, ev.title, ev.desc, ev.location, ev.display_date,
        new Date().toISOString(), ev.display_time, ev.image, ev.capacity, ev.entry, ev.price, ev.approval
      ).run();

      // Party RSVPs
      const attendees = ['seeded_user_1', 'seeded_user_2', 'seeded_user_3', 'seeded_user_5', 'seeded_user_7', 'seeded_user_8', 'seeded_user_10'];
      for (const att of attendees) {
        await db.prepare(`
          INSERT INTO event_attendees (event_id, user_id, status)
          VALUES (?, ?, 'joined')
        `).bind(ev.id, att).run();

        // Feedbacks/Ratings to give realistic quality
        await db.prepare(`
          INSERT INTO event_feedback (id, event_id, user_id, rating, host_rating, would_attend_again, feedback)
          VALUES (?, ?, ?, 5, 5, 1, 'Dynamic vibes, high quality hosts, and great conversations.')
        `).bind(`seeded_feedback_${ev.id}_${att}`, ev.id, att).run();
      }
    }

    // K. Seed 3 Match Outcomes & Meetup Feedbacks to compute dynamic trust scores
    const matchOutcomes = [
      { id: 'seeded_outcome_1', a: 'seeded_user_1', b: 'seeded_user_2', status: 'meetup_completed' },
      { id: 'seeded_outcome_2', a: 'seeded_user_4', b: 'seeded_user_5', status: 'meetup_completed' },
      { id: 'seeded_outcome_3', a: 'seeded_user_9', b: 'seeded_user_10', status: 'meetup_planned' }
    ];

    for (const mo of matchOutcomes) {
      await db.prepare(`
        INSERT INTO match_outcomes (id, user_id_a, user_id_b, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(mo.id, mo.a, mo.b, mo.status).run();

      if (mo.status === 'meetup_completed') {
        // Feedback from User A
        await db.prepare(`
          INSERT INTO meetup_feedback (id, match_outcome_id, reporter_user_id, target_user_id, showed_up, meet_again, rating, would_meet_again, feedback)
          VALUES (?, ?, ?, ?, 1, 1, 5, 1, 'Extremely polite, safety-verified, and great vibes!')
        `).bind(`seeded_feedback_${mo.id}_a`, mo.id, mo.a, mo.b).run();

        // Feedback from User B
        await db.prepare(`
          INSERT INTO meetup_feedback (id, match_outcome_id, reporter_user_id, target_user_id, showed_up, meet_again, rating, would_meet_again, feedback)
          VALUES (?, ?, ?, ?, 1, 1, 5, 1, 'Highly reliable, arrived on time, pleasant cafe conversation.')
        `).bind(`seeded_feedback_${mo.id}_b`, mo.id, mo.b, mo.a).run();
      }
    }

    // Seed 3 Instant Plans
    const plans = [
      {
        id: 'seeded_plan_1',
        creator: 'seeded_user_1',
        title: 'Bandra Pour-Over Session',
        activity: 'Coffee Meetup',
        time: 'Saturday 4:00 PM',
        location: 'Aether Lounge, Bandra West',
        capacity: 4,
        members: ['seeded_user_2', 'seeded_user_3']
      },
      {
        id: 'seeded_plan_2',
        creator: 'seeded_user_2',
        title: 'Pickleball Doubles Court',
        activity: 'Pickleball Match',
        time: 'Sunday 7:30 AM',
        location: 'Gymkhana Court, Santacruz',
        capacity: 4,
        members: ['seeded_user_4']
      },
      {
        id: 'seeded_plan_3',
        creator: 'seeded_user_10',
        title: 'Speakeasy Vinyl & Sourdough',
        activity: 'Night Out',
        time: 'Tonight 8:30 PM',
        location: 'Sea-view Loft, Juhu',
        capacity: 6,
        members: ['seeded_user_1']
      }
    ];

    for (const p of plans) {
      await db.prepare(`
        INSERT INTO instant_plans (id, creator_user_id, title, activity, time, location, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(p.id, p.creator, p.title, p.activity, p.time, p.location, p.capacity).run();

      // Add creator as member
      await db.prepare(`
        INSERT INTO instant_plan_members (plan_id, user_id)
        VALUES (?, ?)
      `).bind(p.id, p.creator).run();

      // Add other members
      for (const m of p.members) {
        await db.prepare(`
          INSERT INTO instant_plan_members (plan_id, user_id)
          VALUES (?, ?)
        `).bind(p.id, m).run();
      }
    }

    // L. Seed 2 Live Chats & Chat Messages between Seed Users
    const seededChats = [
      { id: 'chat-seeded-1', slug: 'seeded-chat-1', from: 'seeded_user_1', to: 'seeded_user_2', msg: 'Hey Kabir, up for quiet pour over coffee this Saturday?' },
      { id: 'chat-seeded-2', slug: 'seeded-chat-2', from: 'seeded_user_10', to: 'seeded_user_1', msg: 'Hey Priyanka, I saw you like film photography, would love to exchange book lists.' }
    ];

    for (const c of seededChats) {
      await db.prepare(`
        INSERT INTO chats (id, slug, participant_a_user_id, participant_b_user_id, seed_data)
        VALUES (?, ?, ?, ?, 1)
      `).bind(c.id, c.slug, c.from, c.to).run();

      // Add a couple messages in thread
      await db.prepare(`
        INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body)
        VALUES (?, ?, ?, 'you', ?)
      `).bind(`msg-seeded-${c.id}-1`, c.id, c.from, c.msg).run();

      await db.prepare(`
        INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body)
        VALUES (?, ?, ?, 'match', 'Absolutely! Let us explore Colaba or Bandra West together.')
      `).bind(`msg-seeded-${c.id}-2`, c.id, c.to).run();
    }

    // M. Generate Realistic Analytics Records (Profile Views, Match Requests, Chat Messages)
    const analytics = [
      { event: 'profile_view', entity: 'profile', id: 'seeded_user_1' },
      { event: 'profile_view', entity: 'profile', id: 'seeded_user_2' },
      { event: 'profile_view', entity: 'profile', id: 'seeded_user_3' },
      { event: 'match_request_sent', entity: 'user', id: 'seeded_user_2' },
      { event: 'match_request_accepted', entity: 'user', id: 'seeded_user_1' },
      { event: 'chat_message_sent', entity: 'chat', id: 'seeded-chat-1' },
      { event: 'event_rsvp', entity: 'event', id: 'seeded_event_social_1' },
      { event: 'meetup_completed', entity: 'meetup', id: 'seeded_outcome_1' }
    ];

    for (let i = 0; i < analytics.length; i++) {
      await db.prepare(`
        INSERT INTO analytics_events (id, user_id, session_id, event_name, entity_type, entity_id, metadata_json, seed_data)
        VALUES (?, ?, 'seeded_session_id', ?, ?, ?, '{}', 1)
      `).bind(`seeded_analytics_${i}`, users[i % users.length].id, analytics[i].event, analytics[i].entity, analytics[i].id).run();
    }

    console.log('Instadate Seeder: auto-seeding completed successfully.');
  } catch (err: any) {
    console.error('Instadate Seeder: Auto-seeding failed due to an error:', err.message || err);
  }
}
