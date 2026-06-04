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
  if (seededUsers && seededUsers.count >= 40 && eventsCount && eventsCount.count >= 5) {
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
      // ==================== MUMBAI (10) ====================
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
        id: 'seeded_user_4',
        email: 'rohan@instadate.club',
        name: 'Rohan Malhotra',
        age: 24,
        instagram: '@rohan_m',
        city: 'Mumbai',
        gender: 'Male',
        profession: 'Investment Analyst',
        college: 'NMIMS Mumbai',
        intent: 'Dating',
        weekend_status: 'Sipping pour-over coffee in Bandra, followed by a late night rooftop mocktail session.',
        bio: 'Finance guy by day, amateur barista by night. Always down for deep conversations, chess, or discovering new city views.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 19.0600,
        lon: 72.8350,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_5',
        email: 'kiara@instadate.club',
        name: 'Kiara Advani',
        age: 23,
        instagram: '@kiara_a',
        city: 'Mumbai',
        gender: 'Female',
        profession: 'Fashion Designer',
        college: 'NIFT Mumbai',
        intent: 'Dating',
        weekend_status: 'Art gallery walkthroughs, sketch booking by the river, and rooftop dinner plans.',
        bio: 'Creative soul, fashion lover, and classic jazz enthusiast. I enjoy coffee, sketching, and meeting values-aligned people.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 19.0520,
        lon: 72.8210,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_6',
        email: 'siddharth@instadate.club',
        name: 'Siddharth Roy',
        age: 26,
        instagram: '@sidd_roy',
        city: 'Mumbai',
        gender: 'Male',
        profession: 'Architect',
        college: 'Sir JJ College of Architecture',
        intent: 'Dating',
        weekend_status: 'Heritage fort walking tour, architectural sketches, and local street photography.',
        bio: 'Architect, sketching enthusiast, and heritage walk explorer. Let\'s walk around Fort, capture vintage buildings, and talk design.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 19.0450,
        lon: 72.8190,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_7',
        email: 'neha@instadate.club',
        name: 'Neha Kapoor',
        age: 22,
        instagram: '@neha_kapoor',
        city: 'Mumbai',
        gender: 'Female',
        profession: 'Content Writer',
        college: 'KC College, Mumbai',
        intent: 'Friendship',
        weekend_status: 'Discovering indie bookstore cafes, buying vintage vinyl, and quiet strolls.',
        bio: 'Avid reader, block-printed apparel lover, and vinyl listener. Let\'s grab a specialty matcha latte and chat about books.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/natasha-1.jpg',
        completion: 1,
        lat: 19.0700,
        lon: 72.8600,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_8',
        email: 'vikranth@instadate.club',
        name: 'Vikranth Mehta',
        age: 25,
        instagram: '@vik_mehta',
        city: 'Mumbai',
        gender: 'Male',
        profession: 'Product Manager',
        college: 'IIT Bombay',
        intent: 'Dating',
        weekend_status: 'Early morning sports court tennis, followed by recovery coffee and brunch.',
        bio: 'Product manager, tech enthusiast, and runner. Down for a game of tennis, startup brainstorming, or a coffee chat.',
        vibe: 'Startup Founder Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 19.0300,
        lon: 72.8700,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_9',
        email: 'alisha@instadate.club',
        name: 'Alisha Patel',
        age: 23,
        instagram: '@alisha_p',
        city: 'Mumbai',
        gender: 'Female',
        profession: 'Public Relations Lead',
        college: 'Sophia College, Mumbai',
        intent: 'Dating',
        weekend_status: 'Clay pottery workshop, discovering indie cafes, and live music dinner dates.',
        bio: 'PR consultant, plant mother, and live acoustic music lover. Let\'s find a quiet rooftop or cafe and have an honest conversation.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/kavya-2.jpg',
        completion: 1,
        lat: 19.0900,
        lon: 72.8400,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_10',
        email: 'arjun@instadate.club',
        name: 'Arjun Kapoor',
        age: 24,
        instagram: '@arjun_k',
        city: 'Mumbai',
        gender: 'Male',
        profession: 'Film Director Assistant',
        college: 'Whistling Woods International',
        intent: 'Dating',
        weekend_status: 'Late night indie movie screening, cafe talks, and weekend photowalk.',
        bio: 'Film geek, analog photography enthusiast, and amateur chef. Let\'s talk screenplays over filter coffee and sourdough toast.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/natasha-2.jpg',
        completion: 1,
        lat: 19.0200,
        lon: 72.8500,
        verification_level: 'highly_verified'
      },

      // ==================== DELHI (10) ====================
      {
        id: 'seeded_user_11',
        email: 'aarav@instadate.club',
        name: 'Aarav Gupta',
        age: 24,
        instagram: '@aarav_gupta',
        city: 'Delhi',
        gender: 'Male',
        profession: 'UI Developer',
        college: 'DTU, Delhi',
        intent: 'Dating',
        weekend_status: 'Exploring cafes in GK, followed by a quiet walk in Lodhi Garden.',
        bio: 'Front-end coder, vintage poster collector, and design lover. Let\'s grab some artisanal coffee and discuss user interfaces.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 28.6139,
        lon: 77.2090,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_12',
        email: 'simran@instadate.club',
        name: 'Simran Kaur',
        age: 23,
        instagram: '@simran_k',
        city: 'Delhi',
        gender: 'Female',
        profession: 'Art Historian',
        college: 'JNU, Delhi',
        intent: 'Dating',
        weekend_status: 'National Gallery walkthrough, sketching monument architecture, and rooftop dinner.',
        bio: 'Art historian, coffee drinker, and history buff. Let\'s talk about Mughal miniature art or vintage novels over chai.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/kavya-1.jpg',
        completion: 1,
        lat: 28.6200,
        lon: 77.2100,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_13',
        email: 'vivaan@instadate.club',
        name: 'Vivaan Khanna',
        age: 25,
        instagram: '@vivaan_k',
        city: 'Delhi',
        gender: 'Male',
        profession: 'Venture Capitalist',
        college: 'FMS Delhi',
        intent: 'Dating',
        weekend_status: 'Weekend tennis court sessions, founder coffee matches, and rooftop dining.',
        bio: 'Startup investor, runner, and book collector. Looking for high-value chats, new startup ideas, or a friendly game of tennis.',
        vibe: 'Startup Founder Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 28.6300,
        lon: 77.2200,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_14',
        email: 'ishita@instadate.club',
        name: 'Ishita Sharma',
        age: 22,
        instagram: '@ishita_s',
        city: 'Delhi',
        gender: 'Female',
        profession: 'Content Marketer',
        college: 'LSR, Delhi University',
        intent: 'Friendship',
        weekend_status: 'Visiting heritage monuments, buying indie bookstore books, and slow walks.',
        bio: 'Bookworm, block-print dress lover, and matcha lover. Down for quiet bookstore browsing and filter coffee.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 28.6400,
        lon: 77.2300,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_15',
        email: 'raghav@instadate.club',
        name: 'Raghav Malhotra',
        age: 26,
        instagram: '@raghav_m',
        city: 'Delhi',
        gender: 'Male',
        profession: 'Product Designer',
        college: 'NID Delhi',
        intent: 'Dating',
        weekend_status: 'Clay pottery workshop, gallery walks, and live jazz music nights.',
        bio: 'Industrial designer, indie pop listener, and custom potter. Let\'s make something creative or talk about minimalist aesthetics.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 28.6000,
        lon: 77.1900,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_16',
        email: 'mehak@instadate.club',
        name: 'Mehak Verma',
        age: 23,
        instagram: '@mehak_v',
        city: 'Delhi',
        gender: 'Female',
        profession: 'Journalist',
        college: 'IIMC, Delhi',
        intent: 'Dating',
        weekend_status: 'Rooftop dinner date, indie bookstore crawls, and local park photography.',
        bio: 'Journalist, street photographer, and coffee collector. Let\'s explore hidden street food spots and talk about local stories.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/natasha-1.jpg',
        completion: 1,
        lat: 28.5900,
        lon: 77.1800,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_17',
        email: 'aditya@instadate.club',
        name: 'Aditya Sengupta',
        age: 24,
        instagram: '@adi_sen',
        city: 'Delhi',
        gender: 'Male',
        profession: 'Corporate Lawyer',
        college: 'NLU Delhi',
        intent: 'Dating',
        weekend_status: 'Jazz cafe session, indie bookstore hopping, and sunset walk.',
        bio: 'Corporate lawyer, history buff, and acoustic guitar player. Let\'s escape the corporate hustle and grab a filter coffee.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 28.6500,
        lon: 77.2500,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_18',
        email: 'tanvi@instadate.club',
        name: 'Tanvi Sethi',
        age: 22,
        instagram: '@tanvi_s',
        city: 'Delhi',
        gender: 'Female',
        profession: 'Research Fellow',
        college: 'Miranda House, DU',
        intent: 'Friendship',
        weekend_status: 'Cafe crawl, monument photowalk, and reading in a quiet garden.',
        bio: 'Sociology graduate, green tea drinker, and sunset collector. Let\'s spend a slow Sunday afternoon reading side-by-side.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/kavya-2.jpg',
        completion: 1,
        lat: 28.6600,
        lon: 77.2600,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_19',
        email: 'kabirmehra@instadate.club',
        name: 'Kabir Mehra',
        age: 25,
        instagram: '@kabir_m',
        city: 'Delhi',
        gender: 'Male',
        profession: 'Creative Copywriter',
        college: 'St. Stephen\'s College',
        intent: 'Dating',
        weekend_status: 'Live music concert, late night coffee crawl, and bookstore stroll.',
        bio: 'Copywriter, vinyl listener, and movie enthusiast. Down to talk screenplays, classic ads, or watch a live acoustic gig.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 28.5800,
        lon: 77.1700,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_20',
        email: 'riyabakshi@instadate.club',
        name: 'Riya Bakshi',
        age: 23,
        instagram: '@riya_b',
        city: 'Delhi',
        gender: 'Female',
        profession: 'Landscape Architect',
        college: 'SPA Delhi',
        intent: 'Dating',
        weekend_status: 'Heritage park tour, pottery session, and local cafe brunch.',
        bio: 'Landscape architect, clay sculptor, and full-time plant mother. Let\'s design a mock balcony garden or paint canvases.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/natasha-2.jpg',
        completion: 1,
        lat: 28.5700,
        lon: 77.1600,
        verification_level: 'highly_verified'
      },

      // ==================== PUNE (5) ====================
      {
        id: 'seeded_user_21',
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
        id: 'seeded_user_22',
        email: 'yash@instadate.club',
        name: 'Yash Kulkarni',
        age: 24,
        instagram: '@yash_k',
        city: 'Pune',
        gender: 'Male',
        profession: 'Aerospace Engineer',
        college: 'COEP, Pune',
        intent: 'Dating',
        weekend_status: 'Trekking to Sinhagad, recovery coffee, and rooftop movie screening.',
        bio: 'Aero engineer, trekker, and indie film buff. Down for a morning mountain climb, star-gazing, or filter coffee.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 18.5300,
        lon: 73.8400,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_23',
        email: 'shreya@instadate.club',
        name: 'Shreya Joshi',
        age: 23,
        instagram: '@shreya_j',
        city: 'Pune',
        gender: 'Female',
        profession: 'Graphic Illustrator',
        college: 'Symbiosis Fine Arts, Pune',
        intent: 'Friendship',
        weekend_status: 'Sketching in Cubbon-style parks, bookshop hopping, and rooftop mocktails.',
        bio: 'Illustrator, cafe lover, and vintage postcard collector. Let\'s grab an iced coffee, draw some local landmarks, and chat.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/kavya-2.jpg',
        completion: 1,
        lat: 18.5100,
        lon: 73.8600,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_24',
        email: 'aditirao@instadate.club',
        name: 'Aditi Rao',
        age: 22,
        instagram: '@aditi_r',
        city: 'Pune',
        gender: 'Female',
        profession: 'Biotech Student',
        college: 'IISER Pune',
        intent: 'Dating',
        weekend_status: 'Artisanal sourdough baking, book swaps, and walking in a quiet lane.',
        bio: 'Science geek, home baker, and book swapper. Down to share sourdough recipes and talk life philosophy over tea.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 18.5000,
        lon: 73.8700,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_25',
        email: 'sameer@instadate.club',
        name: 'Sameer Patwardhan',
        age: 25,
        instagram: '@sameer_p',
        city: 'Pune',
        gender: 'Male',
        profession: 'UX Designer',
        college: 'MIT Pune',
        intent: 'Dating',
        weekend_status: 'Clay pottery class, indie cafe hop, and live music dinner date.',
        bio: 'Product designer, acoustic guitarist, and pottery fan. Let\'s explore Koregaon Park cafes and talk design aesthetics.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 18.5400,
        lon: 73.8300,
        verification_level: 'identity'
      },

      // ==================== HYDERABAD (5) ====================
      {
        id: 'seeded_user_26',
        email: 'saiteja@instadate.club',
        name: 'Sai Teja',
        age: 24,
        instagram: '@sai_teja',
        city: 'Hyderabad',
        gender: 'Male',
        profession: 'Software Architect',
        college: 'IIIT Hyderabad',
        intent: 'Dating',
        weekend_status: 'Exploring cafe lounges in Jubilee Hills, followed by a walk around Durgam Cheruvu.',
        bio: 'Software engineer, startup fan, and filter coffee collector. Let\'s find a quiet lounge and chat value systems.',
        vibe: 'Startup Founder Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 17.3850,
        lon: 78.4867,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_27',
        email: 'niharika@instadate.club',
        name: 'Niharika Reddy',
        age: 23,
        instagram: '@niha_reddy',
        city: 'Hyderabad',
        gender: 'Female',
        profession: 'Interior Designer',
        college: 'NIFT Hyderabad',
        intent: 'Dating',
        weekend_status: 'Art gallery walk, monument photography, and rooftop dinner in Gachibowli.',
        bio: 'Interior stylist, classic jazz collector, and green tea lover. Let\'s explore local heritage architecture and talk art.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/kavya-1.jpg',
        completion: 1,
        lat: 17.3900,
        lon: 78.4900,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_28',
        email: 'pranav@instadate.club',
        name: 'Pranav Rao',
        age: 25,
        instagram: '@pranav_r',
        city: 'Hyderabad',
        gender: 'Male',
        profession: 'Operations Manager',
        college: 'ISB Hyderabad',
        intent: 'Dating',
        weekend_status: 'Early morning sports court tennis, followed by recovery coffee and brunch.',
        bio: 'Operations head, marathon runner, and book reader. Down for a tennis match, value talks, or coffee hopping.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 17.4000,
        lon: 78.5000,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_29',
        email: 'divyareddy@instadate.club',
        name: 'Divya Reddy',
        age: 22,
        instagram: '@divya_r',
        city: 'Hyderabad',
        gender: 'Female',
        profession: 'Content Specialist',
        college: 'Osmania University',
        intent: 'Friendship',
        weekend_status: 'Indie bookstore hop, quiet cafe reading, and lake-side strolls.',
        bio: 'Writer, block-printed saree lover, and local matcha fan. Let\'s spend a quiet afternoon reviewing books and drinking coffee.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 17.3700,
        lon: 78.4700,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_30',
        email: 'karthik@instadate.club',
        name: 'Karthik Goud',
        age: 25,
        instagram: '@karthik_g',
        city: 'Hyderabad',
        gender: 'Male',
        profession: 'Independent Filmmaker',
        college: 'Annapurna College of Film',
        intent: 'Dating',
        weekend_status: 'Indie film screening, vinyl record hunting, and live concert nights.',
        bio: 'Filmmaker, gig photographer, and vinyl fan. Let\'s grab a strong coffee and talk screenplays or music gigs.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 17.3600,
        lon: 78.4600,
        verification_level: 'highly_verified'
      },

      // ==================== AHMEDABAD (5) ====================
      {
        id: 'seeded_user_31',
        email: 'riyasharma@instadate.club',
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
        id: 'seeded_user_32',
        email: 'harsh@instadate.club',
        name: 'Harsh Shah',
        age: 24,
        instagram: '@harsh_s',
        city: 'Ahmedabad',
        gender: 'Male',
        profession: 'Textile Innovator',
        college: 'NIFT Gandhinagar',
        intent: 'Dating',
        weekend_status: 'Heritage walk in Old Ahmedabad, block printing session, and authentic Gujarati Thali.',
        bio: 'Textile designer, history geek, and tea collector. Let\'s explore old pols, document block prints, and talk culture.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 23.0300,
        lon: 72.5600,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_33',
        email: 'janki@instadate.club',
        name: 'Janki Patel',
        age: 22,
        instagram: '@janki_p',
        city: 'Ahmedabad',
        gender: 'Female',
        profession: 'Fine Arts Student',
        college: 'CN College of Fine Arts',
        intent: 'Friendship',
        weekend_status: 'Gallery walks, riverfront sketching, and rooftop mocktails.',
        bio: 'Painter, clay modeller, and postcard lover. Down for a quiet sketching session next to Sabarmati Riverfront.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/natasha-1.jpg',
        completion: 1,
        lat: 23.0100,
        lon: 72.5800,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_34',
        email: 'dhruv@instadate.club',
        name: 'Dhruv Mehta',
        age: 25,
        instagram: '@dhruv_m',
        city: 'Ahmedabad',
        gender: 'Male',
        profession: 'Chartered Accountant',
        college: 'HL College of Commerce',
        intent: 'Dating',
        weekend_status: 'Morning tennis matches, coffee catchups, and reading values books.',
        bio: 'Finance guy, active sports player, and classical music fan. Down for coffee, values talks, or a game of tennis.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 23.0400,
        lon: 72.5500,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_35',
        email: 'pooja@instadate.club',
        name: 'Pooja Vyas',
        age: 23,
        instagram: '@pooja_v',
        city: 'Ahmedabad',
        gender: 'Female',
        profession: 'Landscape Architect',
        college: 'CEPT University',
        intent: 'Dating',
        weekend_status: 'Visiting heritage gardens, botanical sketches, and live folk music nights.',
        bio: 'Landscape designer, clay sculptor, and botanical collector. Let\'s paint canvases and share quiet values talks.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/natasha-2.jpg',
        completion: 1,
        lat: 23.0000,
        lon: 72.5900,
        verification_level: 'highly_verified'
      },

      // ==================== CHENNAI (5) ====================
      {
        id: 'seeded_user_36',
        email: 'ashwin@instadate.club',
        name: 'Ashwin Kumar',
        age: 25,
        instagram: '@ashwin_k',
        city: 'Chennai',
        gender: 'Male',
        profession: 'Marine Biologist',
        college: 'IIT Madras',
        intent: 'Dating',
        weekend_status: 'Beach cleanups at ECR, morning walks, followed by hot filter coffee.',
        bio: 'Marine enthusiast, outdoor trekker, and vinyl collector. Let\'s grab a strong South Indian coffee and walk ECR beach.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/zara-1.jpg',
        completion: 1,
        lat: 13.0827,
        lon: 80.2707,
        verification_level: 'highly_verified'
      },
      {
        id: 'seeded_user_37',
        email: 'shruti@instadate.club',
        name: 'Shruti Iyer',
        age: 23,
        instagram: '@shruti_i',
        city: 'Chennai',
        gender: 'Female',
        profession: 'Carnatic Vocalist',
        college: 'Stella Maris College, Chennai',
        intent: 'Dating',
        weekend_status: 'Acoustic concert rehearsals, classical gallery walk, and rooftop dinner.',
        bio: 'Vocalist, music history student, and tea collector. Let\'s find a quiet cafe, exchange acoustic playlists, and talk values.',
        vibe: 'Concert Vibe',
        avatar_url: '/assets/member-photos/kavya-1.jpg',
        completion: 1,
        lat: 13.0900,
        lon: 80.2800,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_38',
        email: 'vikram@instadate.club',
        name: 'Vikram Raja',
        age: 24,
        instagram: '@vikram_r',
        city: 'Chennai',
        gender: 'Male',
        profession: 'Creative Copywriter',
        college: 'Loyola College, Chennai',
        intent: 'Dating',
        weekend_status: 'Indie bookstore crawls, vintage postcard hunting, and specialty coffee.',
        bio: 'Copywriter, movie buff, and street photographer. Let\'s explore quiet book shops and talk about screenplays.',
        vibe: 'Cafe Partner Vibe',
        avatar_url: '/assets/member-photos/priya-1.jpg',
        completion: 1,
        lat: 13.0700,
        lon: 80.2600,
        verification_level: 'basic'
      },
      {
        id: 'seeded_user_39',
        email: 'meenakshi@instadate.club',
        name: 'Meenakshi Sundaram',
        age: 22,
        instagram: '@meena_s',
        city: 'Chennai',
        gender: 'Female',
        profession: 'Heritage Conservationist',
        college: 'Madras Fine Arts College',
        intent: 'Friendship',
        weekend_status: 'Heritage temple walk, drawing ancient structures, and quiet beach sunset.',
        bio: 'Architect student, block print sketcher, and history buff. Let\'s discuss temple restoration over filter coffee.',
        vibe: 'Art Gallery Vibe',
        avatar_url: '/assets/member-photos/zara-2.jpg',
        completion: 1,
        lat: 13.1000,
        lon: 80.2900,
        verification_level: 'identity'
      },
      {
        id: 'seeded_user_40',
        email: 'karthikraj@instadate.club',
        name: 'Karthik Goud',
        age: 25,
        instagram: '@karthik_raj',
        city: 'Chennai',
        gender: 'Male',
        profession: 'Product designer',
        college: 'NID Chennai',
        intent: 'Dating',
        weekend_status: 'Clay pottery workshop, discovering indie bookstore cafes, and late night strolls.',
        bio: 'Product builder, amateur barista, and plant caretaker. Down for custom pottery, value talks, or ECR coffee hopping.',
        vibe: 'Travel Buddy Vibe',
        avatar_url: '/assets/member-photos/priya-2.jpg',
        completion: 1,
        lat: 13.0600,
        lon: 80.2500,
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
