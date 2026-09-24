import { Plan, TrainerMessage, Member, Staff, Expense, InventoryItem, Blog, Transformation, Payment, AttendanceRecord } from '../types';

export const MEMBERSHIP_PLANS: Plan[] = [
  {
    id: 'plan_monthly',
    name: 'Elite Monthly',
    duration: '1 Month',
    price: 2499,
    features: [
      'Access to all Cardio & Strength areas',
      '1 Complimentary Body Composition Analysis',
      'Locker room & Steam access',
      'Free high-speed Gym Wi-Fi',
      'Standard opening hours access'
    ]
  },
  {
    id: 'plan_quarterly',
    name: 'Pro Quarterly',
    duration: '3 Months',
    price: 5999,
    features: [
      'All Elite Monthly features',
      '2 Personal Training sessions',
      'Diet consultation & customized macronutrient chart',
      '1 Guest Pass per month',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'plan_half_yearly',
    name: 'Power Half Year',
    duration: '6 Months',
    price: 9999,
    features: [
      'All Pro Quarterly features',
      '5 Personal Training sessions',
      'Unlimited fitness progress tracking',
      '3 Guest Passes per month',
      'Official Fit X Gym T-Shirt + Shaker',
      'Freeze membership option (up to 15 days)'
    ]
  },
  {
    id: 'plan_annual',
    name: 'Champion Annual',
    duration: '12 Months',
    price: 16999,
    features: [
      'All Power Half Year features',
      '12 Personal Training sessions',
      'Free access to CrossFit & Zumba classes',
      'Unlimited Body Composition Analyzers',
      'Official Premium Fit X Gym Gymshark-style Hoodie',
      'Freeze membership option (up to 45 days)',
      '10% discount on all supplement bar products'
    ]
  },
  {
    id: 'plan_couple',
    name: 'Duo Power (Couple)',
    duration: '3 Months',
    price: 9999,
    features: [
      'Complete access for 2 members',
      'Group personal training setup',
      'Twin diet charts & body analyzers',
      'Locker & Steam room access',
      'Official couple swag kits'
    ]
  },
  {
    id: 'plan_student',
    name: 'Student Hustle',
    duration: '1 Month',
    price: 1799,
    features: [
      'Full facility access (11 AM to 5 PM only)',
      'Standard locker room access',
      'Student ID verification required',
      'Workout tracking sheet'
    ]
  },
  {
    id: 'plan_pt',
    name: 'Elite Personal Training Addon',
    duration: '1 Month',
    price: 7999,
    features: [
      '1-on-1 dedicated certified coach',
      '12 private coaching sessions',
      'Daily diet monitoring & adjustments',
      'Competition prep / Powerlifting specialized training',
      'Weekly blood oxygen & heart rate tracking'
    ]
  }
];

export const MOCK_TRAINERS = [
  {
    id: 'trainer_1',
    name: 'Deepak "Iron" Solanki',
    role: 'Owner & Head Coach',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    specialization: 'Bodybuilding & Elite Contest Prep',
    experience: '15 Years',
    rating: 5.0,
    certifications: ['IFBB Pro Card Holder', 'Gold\'s Gym University Certified', 'ISSA Nutrition Specialist'],
    achievements: ['🥇 Mr. Uttar Pradesh Overall Champion (2018)', '🥇 National Bodybuilding Federation Gold (2020)', '🥈 Sheru Classic District Champion (2017)'],
    bio: 'Deepak founded Fit X Gym with a single-minded vision: to deliver world-class training facilities and science-backed programs to everyone from casual fitness enthusiasts to elite professional athletes.',
    videos: ['https://assets.mixkit.co/videos/preview/mixkit-man-holding-heavy-barbell-in-gym-34293-large.mp4']
  },
  {
    id: 'trainer_2',
    name: 'Ronny Singh',
    role: 'Senior Powerlifting Specialist',
    photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500&auto=format&fit=crop&q=80',
    specialization: 'Strength Training & Powerlifting',
    experience: '8 Years',
    rating: 4.9,
    certifications: ['IPF Level 2 Strength Coach', 'CPR/AED Certified', 'NSCA Certified Strength Coach'],
    achievements: ['🥇 State Powerlifting Champion 105kg Class (2022)', '🥈 National Benchpress Championship Silver (2021)'],
    bio: 'Ronny focuses on functional strength, compound lifts, and bulletproof joint prep. If you want to bench, squat, or deadlift twice your bodyweight, he is your coach.',
    videos: []
  },
  {
    id: 'trainer_3',
    name: 'Maria DeSouza',
    role: 'Nutritionist & CrossFit Coach',
    photo: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=500&auto=format&fit=crop&q=80',
    specialization: 'CrossFit, Weight Loss, Diet Prep',
    experience: '6 Years',
    rating: 4.8,
    certifications: ['CrossFit Level 3 Coach', 'Precision Nutrition Level 1 Certification', 'BS Sports Nutrition'],
    achievements: ['🥇 Fittest Female in Region (CrossFit Games Open 2021)', '🌟 Featured Speaker at National Health & Wellness Summit'],
    bio: 'Maria blends high-intensity functional training with deep nutritional planning to create sustainable fat-loss and muscle-gain regimens that work for busy working professionals.',
    videos: []
  },
  {
    id: 'trainer_4',
    name: 'Rahul Yadav',
    role: 'HIIT & Mobility Coach',
    photo: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=500&auto=format&fit=crop&q=80',
    specialization: 'Weight Loss, Athletic Mobility, HIIT',
    experience: '5 Years',
    rating: 4.8,
    certifications: ['NASM Certified Personal Trainer', 'FMS Functional Movement Screen Practitioner'],
    achievements: ['🥇 State Athletic Meet 100m Sprinter Champion (2019)', '🎓 Sports Science Degree, DU'],
    bio: 'Rahul focuses on athletic longevity, high-energy fat burning, posture correction, and cardiovascular endurance.',
    videos: []
  }
];

export const MOCK_TRANSFORMATIONS: Transformation[] = [
  {
    id: 'trans_1',
    name: 'Aditya Verma',
    beforeWeight: 98,
    afterWeight: 76,
    duration: '6 Months',
    quote: 'Joining Fit X Gym completely transformed my lifestyle. Deepak\'s customized nutrition plan combined with Maria\'s CrossFit classes helped me shed 22kg and build muscle I didn\'t know I had!',
    beforeImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80', // gym photo before vibe
    afterImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80',
    category: 'Fat Loss'
  },
  {
    id: 'trans_2',
    name: 'Vikram Phogat',
    beforeWeight: 62,
    afterWeight: 75,
    duration: '8 Months',
    quote: 'Under Ronny\'s guidance on strength cycles, I gained 13kg of lean muscle mass. My squat went from 80kg to 175kg. This is the only gym with a real iron atmosphere!',
    beforeImg: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=80',
    category: 'Muscle Gain'
  },
  {
    id: 'trans_3',
    name: 'Pooja Hegde',
    beforeWeight: 74,
    afterWeight: 59,
    duration: '4 Months',
    quote: 'Maria helped me correct my PCOS metabolic slowdown. The workouts were intense but customized. I lost 15kg and feel stronger, energetic and healthier than ever.',
    beforeImg: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&auto=format&fit=crop&q=80',
    afterImg: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&auto=format&fit=crop&q=80',
    category: 'Fat Loss'
  }
];

export const MOCK_BLOGS: Blog[] = [
  {
    id: 'blog_1',
    title: 'The Ultimate Guide to Hypertrophy: Rep Ranges and Science',
    category: 'Muscle Gain',
    author: 'Deepak Solanki',
    excerpt: 'Is 8-12 reps really the optimal hypertrophy range? Discover the latest scientific evidence regarding muscular volume, intensity, and muscle growth.',
    content: 'For decades, the standard bodybuilding advice has been to lift weights in the 8-12 repetition range for maximum muscle growth. However, recent sports science research shows that muscle hypertrophy can be achieved across a much wider spectrum of loads, provided that sets are taken close to muscular failure (1-3 reps in reserve).\n\nKey pillars of muscle growth:\n1. Mechanical Tension: The primary driver. This is accomplished by lifting heavy loads or lifting lighter loads to complete failure.\n2. Progressive Overload: Over time, you must increase weight, reps, or volume to continue forcing adaptations.\n3. Muscle Damage & Metabolic Stress: The pumping effect, which triggers cellular swelling.\n\nAt Fit X Gym, we design programs that blend heavy compound lifts (3-5 rep range) to build strength/mechanical tension, followed by moderate-to-high rep accessory work (8-20 rep range) to accumulate volume and metabolic fatigue. To maximize growth, ensure you eat a surplus of calories with at least 1.6g to 2.2g of protein per kilogram of body weight daily.',
    readTime: '5 min read',
    date: '2026-07-01',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'blog_2',
    title: 'The Secret to Busting Fat: Energy Balance vs Hormone Control',
    category: 'Fat Loss',
    author: 'Maria DeSouza',
    excerpt: 'Calories-in vs Calories-out or insulin management? We deconstruct the fat loss debate to give you a clear, actionable guide for your fat-loss journey.',
    content: 'When it comes to shedding stubborn fat, there is a fierce debate online between the Calories-In Calories-Out (CICO) camp and the insulin/hormone camp. The truth is, these two mechanisms do not conflict; they are deeply connected.\n\nTo lose fat, a caloric deficit is an absolute physical requirement. Your body cannot burn stored fat unless it has an energy deficit. However, the quality of your calories dictates how easy or hard it is to maintain that deficit.\n\nWhy hormones matter:\n- Protein & Fiber: Help secrete satiety hormones (Leptin, Peptide YY), reducing hunger and keeping you full longer.\n- Refined Carbohydrates: Spike Insulin, causing quick energy drops and cravings, making it difficult to adhere to your caloric goals.\n- Cortisol (Stress): High stress levels cause water retention and sugar cravings.\n\nPractical Action Plan:\n1. Calculate your TDEE (Total Daily Energy Expenditure) and eat 300-500 calories below it.\n2. Consume 30% of your calories from high-quality lean protein (Whey, Eggs, Paneer, Chicken).\n3. Lift weights 3-4 times a week to preserve muscle mass while losing weight, so you look toned and athletic, rather than just "skinny-fat".',
    readTime: '7 min read',
    date: '2026-07-10',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'blog_3',
    title: 'Supplements That Actually Work: Science vs Marketing Hype',
    category: 'Supplements',
    author: 'Maria DeSouza',
    excerpt: '90% of supplement store shelves are pure marketing waste. Find out which 4 supplements are backed by golden-standard scientific research.',
    content: 'Walk into any supplement store, and you will see dazzling jars of pre-workouts, fat burners, testosterone boosters, and amino acids. Sadly, most of these offer minimal benefits compared to their massive price tags.\n\nHere are the 4 supplements that are scientifically proven to be highly effective:\n\n1. Creatine Monohydrate: The most researched supplement in history. Creatine regenerates ATP (muscle energy), letting you push out 1-2 extra reps during heavy lifts. It increases strength, explosive power, and cellular hydration. Dosage: 3-5g daily, anytime.\n2. Whey Protein: Simply a highly convenient source of bioavailable protein. Perfect post-workout when you cannot prep a whole food meal quickly.\n3. Caffeine: The active ingredient behind every pre-workout. It increases focus, pain tolerance, and stamina. Use black coffee or caffeine capsules 30 mins before a workout.\n4. Vitamin D3 & Fish Oil: Essential for bone health, testosterone synthesis, joint lubrication, and reducing overall inflammation in hard-training individuals.',
    readTime: '6 min read',
    date: '2026-07-14',
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MEM-9021',
    name: 'Kabir Malhotra',
    email: 'kabir.m@gmail.com',
    phone: '+91 98765 43210',
    password: '123456',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    joinDate: '2026-05-15',
    expiryDate: '2026-08-15',
    planId: 'plan_quarterly',
    status: 'Active',
    emergencyContact: {
      name: 'Rohan Malhotra',
      phone: '+91 98765 43211',
      relationship: 'Brother'
    },
    medicalHistory: ['Asthma (Mild, uses inhaler occasionally)'],
    idProofUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=80',
    qrCodeValue: 'FITX_MEM_9021',
    weightHistory: [
      { date: 'May 15', weight: 88.5 },
      { date: 'Jun 01', weight: 86.8 },
      { date: 'Jun 15', weight: 85.2 },
      { date: 'Jul 01', weight: 83.9 },
      { date: 'Jul 15', weight: 82.1 }
    ],
    measurementsHistory: [
      { date: 'May 15', chest: 42, biceps: 14.5, waist: 36, thighs: 23 },
      { date: 'Jul 15', chest: 43.5, biceps: 15.1, waist: 33, thighs: 23.5 }
    ],
    bmi: 24.3,
    bodyFat: 18.5,
    workoutPlan: [
      {
        day: 'Monday (Push Day)',
        workout: 'Chest, Shoulders & Triceps',
        exercises: [
          { name: 'Incline Dumbbell Bench Press', sets: '4 Sets x 8-10 Reps', completed: true },
          { name: 'Overhead Military Press', sets: '3 Sets x 8 Reps', completed: true },
          { name: 'Chest Dips', sets: '3 Sets x Max Reps', completed: false },
          { name: 'Lateral Raises', sets: '4 Sets x 12-15 Reps', completed: false },
          { name: 'Tricep Overhead Rope Extension', sets: '3 Sets x 12 Reps', completed: false }
        ]
      },
      {
        day: 'Tuesday (Pull Day)',
        workout: 'Back & Biceps',
        exercises: [
          { name: 'Weighted Pull-Ups', sets: '3 Sets x 6-8 Reps' },
          { name: 'Barbell Row', sets: '4 Sets x 8 Reps' },
          { name: 'Lat Pull-down', sets: '3 Sets x 10-12 Reps' },
          { name: 'Incline Dumbbell Curls', sets: '4 Sets x 10 Reps' },
          { name: 'Hammer Curls', sets: '3 Sets x 12 Reps' }
        ]
      }
    ],
    dietPlan: [
      {
        meal: 'Breakfast (Post-Workout)',
        time: '08:30 AM',
        items: ['4 Egg Whites Scrambled', '2 Slices Brown Bread', '1 Banana', '30g Whey Protein Shake'],
        macros: { protein: 42, carbs: 45, fats: 8, calories: 420 }
      },
      {
        meal: 'Lunch',
        time: '01:30 PM',
        items: ['150g Grilled Chicken / Tofu', '100g Boiled Basmati Rice', 'Steamed Broccoli & Carrot', '1 tsp Olive Oil'],
        macros: { protein: 38, carbs: 40, fats: 10, calories: 402 }
      },
      {
        meal: 'Evening Snack',
        time: '05:30 PM',
        items: ['100g Low-fat Paneer / Greek Yogurt', '20g Roasted Almonds', '1 Apple'],
        macros: { protein: 22, carbs: 20, fats: 15, calories: 303 }
      },
      {
        meal: 'Dinner',
        time: '08:45 PM',
        items: ['150g Salmon / Soya Chunks', 'Mixed Green Salad', '100g Roasted Sweet Potato'],
        macros: { protein: 35, carbs: 30, fats: 12, calories: 368 }
      }
    ],
    messages: [
      { id: '1', sender: 'Trainer', text: 'Hey Kabir, excellent work pushing through that incline dumbbell press yesterday. Did your shoulder feel okay?', timestamp: '2026-07-15T18:00:00Z' },
      { id: '2', sender: 'Member', text: 'Thanks Coach Deepak! Yes, it felt solid. No joint pain today, just great muscle soreness!', timestamp: '2026-07-15T19:15:00Z' },
      { id: '3', sender: 'Trainer', text: 'Perfect. Increase the weight by 2.5kg next Monday. Keep tracking your morning weight!', timestamp: '2026-07-16T07:30:00Z' }
    ]
  },
  {
    id: 'MEM-3184',
    name: 'Anjali Deshmukh',
    email: 'anjali.d@yahoo.com',
    phone: '+91 87654 32109',
    password: '123456',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    joinDate: '2026-01-10',
    expiryDate: '2027-01-10',
    planId: 'plan_annual',
    status: 'Active',
    emergencyContact: {
      name: 'Vikas Deshmukh',
      phone: '+91 87654 32100',
      relationship: 'Father'
    },
    medicalHistory: ['Hypothyroidism (Controlled with Thyronorm 50mcg)'],
    idProofUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=80',
    qrCodeValue: 'FITX_MEM_3184',
    weightHistory: [
      { date: 'Jan 10', weight: 74.0 },
      { date: 'Mar 10', weight: 70.2 },
      { date: 'May 10', weight: 66.8 },
      { date: 'Jun 10', weight: 64.1 },
      { date: 'Jul 10', weight: 62.5 }
    ],
    measurementsHistory: [
      { date: 'Jan 10', chest: 36, biceps: 12, waist: 32, thighs: 24 },
      { date: 'Jul 10', chest: 34.5, biceps: 11.2, waist: 27, thighs: 22 }
    ],
    bmi: 22.1,
    bodyFat: 23.4,
    workoutPlan: [
      {
        day: 'Monday (Full Body HIIT & Core)',
        workout: 'Cardio Core & Metabolic Burn',
        exercises: [
          { name: 'Kettlebell Swings', sets: '4 Sets x 45 secs', completed: true },
          { name: 'Dumbbell Thrusters', sets: '4 Sets x 15 Reps', completed: true },
          { name: 'Plank with Shoulder Taps', sets: '3 Sets x 60 secs', completed: true },
          { name: 'Rowing Machine Sprint', sets: '5 Rounds x 200m', completed: false },
          { name: 'Hanging Knee Raises', sets: '3 Sets x 15 Reps', completed: false }
        ]
      }
    ],
    dietPlan: [
      {
        meal: 'Breakfast',
        time: '08:00 AM',
        items: ['Oatmeal with 1 Scoop Whey Protein', '10g Chia Seeds', 'Handful Blueberries'],
        macros: { protein: 30, carbs: 35, fats: 6, calories: 314 }
      },
      {
        meal: 'Lunch',
        time: '01:00 PM',
        items: ['Grilled Paneer Salad', 'Cucumber, Onion & Tomato with Lemon juice', '50g Quinoa'],
        macros: { protein: 24, carbs: 28, fats: 14, calories: 334 }
      }
    ],
    messages: [
      { id: '1', sender: 'Trainer', text: 'Anjali, how are the energy levels on the new carbohydrate cycle?', timestamp: '2026-07-14T09:00:00Z' },
      { id: '2', sender: 'Member', text: 'Hi Maria, they are fantastic! No mid-day crashes anymore, and sleeping much better!', timestamp: '2026-07-14T11:45:00Z' }
    ]
  },
  {
    id: 'MEM-5629',
    name: 'Gaurav Paswan',
    email: 'gaurav.paswan@gmail.com',
    phone: '+91 76543 21098',
    password: '123456',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    joinDate: '2026-06-18',
    expiryDate: '2026-07-18',
    planId: 'plan_monthly',
    status: 'Active', // Expiry is 18th July, so near expiry. Useful to test reminders!
    emergencyContact: {
      name: 'Sunita Paswan',
      phone: '+91 76543 21099',
      relationship: 'Mother'
    },
    medicalHistory: ['None'],
    idProofUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=80',
    qrCodeValue: 'FITX_MEM_5629',
    weightHistory: [
      { date: 'Jun 18', weight: 81.2 },
      { date: 'Jul 15', weight: 80.5 }
    ],
    measurementsHistory: [
      { date: 'Jun 18', chest: 40, biceps: 13.5, waist: 34, thighs: 22 }
    ],
    bmi: 25.8,
    bodyFat: 21.0,
    workoutPlan: [],
    dietPlan: [],
    messages: []
  },
  {
    id: 'MEM-1102',
    name: 'Preeti Sharma',
    email: 'preeti.sharma@outlook.com',
    phone: '+91 9760260553',
    password: '123456',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    joinDate: '2025-12-15',
    expiryDate: '2026-06-15',
    planId: 'plan_half_yearly',
    status: 'Expired', // Expired member to showcase renewals and outstanding/expired states
    emergencyContact: {
      name: 'Karan Sharma',
      phone: '+91 9760260553',
      relationship: 'Husband'
    },
    medicalHistory: ['Lower back herniated disc (L4-L5, recovering, avoid heavy deadlifts)'],
    idProofUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=80',
    qrCodeValue: 'FITX_MEM_1102',
    weightHistory: [
      { date: 'Dec 15', weight: 68.0 },
      { date: 'Feb 15', weight: 64.2 },
      { date: 'Apr 15', weight: 61.5 },
      { date: 'Jun 15', weight: 59.8 }
    ],
    measurementsHistory: [],
    bmi: 21.8,
    bodyFat: 22.5,
    workoutPlan: [],
    dietPlan: [],
    messages: [
      { id: '1', sender: 'Trainer', text: 'Hey Preeti, your membership expired on June 15. Let me know when you want to resume your rehabilitation workouts, we can extend it or setup a renewal!', timestamp: '2026-06-16T10:00:00Z' }
    ]
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'STF-01',
    name: 'Deepak Solanki',
    role: 'Owner',
    salary: 150000,
    shift: '06:00 AM - 10:00 PM',
    joiningDate: '2024-01-01',
    attendanceRate: 100,
    performance: 5,
    leavesRemaining: 30,
    documents: ['Aadhaar Card', 'IFBB Pro Card License', 'Gym Business Registration Certificate'],
    salaryHistory: [
      { date: 'Jun 2026', amount: 150000, status: 'Paid' },
      { date: 'May 2026', amount: 150000, status: 'Paid' }
    ],
    tasks: [
      { id: 't1', text: 'Review quarterly financial report', completed: false, deadline: '2026-07-20' },
      { id: 't2', text: 'Approve new batch of whey protein inventory', completed: true, deadline: '2026-07-15' },
      { id: 't3', text: 'Interview candidate for evening cleaner role', completed: false, deadline: '2026-07-18' }
    ]
  },
  {
    id: 'STF-02',
    name: 'Ronny Singh',
    role: 'Trainer',
    salary: 45000,
    shift: '06:00 AM - 02:00 PM',
    joiningDate: '2024-08-15',
    attendanceRate: 94,
    performance: 5,
    leavesRemaining: 12,
    documents: ['Aadhaar Card', 'IPF Level 2 Certification'],
    salaryHistory: [
      { date: 'Jun 2026', amount: 45000, status: 'Paid' },
      { date: 'May 2026', amount: 45000, status: 'Paid' }
    ],
    tasks: [
      { id: 't1', text: 'Conduct fitness assessments for 3 new quarterly members', completed: false, deadline: '2026-07-18' },
      { id: 't2', text: 'Clean and oil the bench press and squat racks', completed: true, deadline: '2026-07-14' }
    ]
  },
  {
    id: 'STF-03',
    name: 'Maria DeSouza',
    role: 'Nutritionist',
    salary: 40000,
    shift: '11:00 AM - 07:00 PM',
    joiningDate: '2025-02-01',
    attendanceRate: 98,
    performance: 4,
    leavesRemaining: 14,
    documents: ['Aadhaar Card', 'BS Sports Nutrition Degree'],
    salaryHistory: [
      { date: 'Jun 2026', amount: 40000, status: 'Paid' },
      { date: 'May 2026', amount: 40000, status: 'Paid' }
    ],
    tasks: [
      { id: 't1', text: 'Update Kabir Malhotras carbohydrate cycling diet sheet', completed: true, deadline: '2026-07-15' },
      { id: 't2', text: 'Publish a new blog post regarding fat loss vs hormones', completed: true, deadline: '2026-07-10' }
    ]
  },
  {
    id: 'STF-04',
    name: 'Neha Kapoor',
    role: 'Reception',
    salary: 22000,
    shift: '06:00 AM - 02:00 PM',
    joiningDate: '2025-05-10',
    attendanceRate: 96,
    performance: 4,
    leavesRemaining: 15,
    documents: ['Aadhaar Card', 'Graduate Marksheet'],
    salaryHistory: [
      { date: 'Jun 2026', amount: 22000, status: 'Paid' },
      { date: 'May 2026', amount: 22000, status: 'Paid' }
    ],
    tasks: [
      { id: 't1', text: 'Scan QR check-ins and verify pending member dues', completed: false, deadline: 'Daily' },
      { id: 't2', text: 'Collect monthly fee from Gaurav Paswan on next entry', completed: false, deadline: '2026-07-18' }
    ]
  },
  {
    id: 'STF-05',
    name: 'Ram Singh',
    role: 'Cleaner',
    salary: 12000,
    shift: '01:00 PM - 09:00 PM',
    joiningDate: '2024-03-01',
    attendanceRate: 91,
    performance: 4,
    leavesRemaining: 8,
    documents: ['Aadhaar Card'],
    salaryHistory: [
      { date: 'Jun 2026', amount: 12000, status: 'Paid' },
      { date: 'May 2026', amount: 12000, status: 'Paid' }
    ],
    tasks: [
      { id: 't1', text: 'Sanitize gym floor and cardio handles twice a shift', completed: true, deadline: 'Daily' },
      { id: 't2', text: 'Empty and sanitize steam room water tanks', completed: false, deadline: 'Every Thursday' }
    ]
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-101', category: 'Rent', amount: 45000, date: '2026-07-01', description: 'Monthly gym floor commercial property rent payment', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-102', category: 'Electricity', amount: 18400, date: '2026-07-05', description: 'AC & high density lighting electric bill', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-103', category: 'Salary', amount: 119000, date: '2026-07-01', description: 'Staff salaries for June 2026 (Excluding Owner)', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-104', category: 'Protein/Supplements', amount: 35000, date: '2026-07-10', description: 'Procurement of Gold Standard Whey & Creatine stock', paymentMethod: 'Card', status: 'Paid' },
  { id: 'EXP-105', category: 'Maintenance/Repairs', amount: 4800, date: '2026-07-12', description: 'Lat pull-down cable replacement and pulleys greasing', paymentMethod: 'Cash', status: 'Paid' },
  { id: 'EXP-106', category: 'Water', amount: 2100, date: '2026-07-02', description: '20L Drinking water cans subscription', paymentMethod: 'Cash', status: 'Paid' },
  { id: 'EXP-107', category: 'Cleaning', amount: 3200, date: '2026-07-04', description: 'Disinfectant liquids, sanitizers and microfibers restocking', paymentMethod: 'Cash', status: 'Paid' },
  { id: 'EXP-108', category: 'Marketing', amount: 12000, date: '2026-07-08', description: 'Instagram local geo-targeted video advertisement campaign', paymentMethod: 'Card', status: 'Paid' },
  { id: 'EXP-109', category: 'Rent', amount: 45000, date: '2026-09-01', description: 'September gym floor rent', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-110', category: 'Electricity', amount: 19200, date: '2026-09-05', description: 'September electricity bill', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-111', category: 'Salary', amount: 121000, date: '2026-09-01', description: 'Staff salaries for August 2026', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'EXP-112', category: 'Cleaning', amount: 3400, date: '2026-09-03', description: 'Monthly cleaning supplies restock', paymentMethod: 'Cash', status: 'Paid' }
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'PAY-201', memberId: 'MEM-3184', memberName: 'Anjali Deshmukh', amount: 16999, date: '2026-01-10', category: 'Membership', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-4521' },
  { id: 'PAY-202', memberId: 'MEM-9021', memberName: 'Kabir Malhotra', amount: 5999, date: '2026-05-15', category: 'Membership', paymentMethod: 'Card', status: 'Completed', invoiceNo: 'FTX-INV-4981' },
  { id: 'PAY-203', memberId: 'MEM-5629', memberName: 'Gaurav Paswan', amount: 2499, date: '2026-06-18', category: 'Membership', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-5011' },
  { id: 'PAY-204', memberId: 'MEM-9021', memberName: 'Kabir Malhotra', amount: 7999, date: '2026-06-15', category: 'Personal Training', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-5023' },
  { id: 'PAY-205', memberId: 'MEM-3184', memberName: 'Anjali Deshmukh', amount: 3200, date: '2026-07-02', category: 'Supplements', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-5110' },
  { id: 'PAY-206', memberId: 'MEM-9021', memberName: 'Kabir Malhotra', amount: 1500, date: '2026-07-05', category: 'Merchandise', paymentMethod: 'Cash', status: 'Completed', invoiceNo: 'FTX-INV-5125' },
  { id: 'PAY-207', memberId: 'MEM-3184', memberName: 'Anjali Deshmukh', amount: 5999, date: '2026-09-02', category: 'Membership', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-5201' },
  { id: 'PAY-208', memberId: 'MEM-5629', memberName: 'Gaurav Paswan', amount: 2499, date: '2026-09-08', category: 'Membership', paymentMethod: 'UPI', status: 'Completed', invoiceNo: 'FTX-INV-5208' }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'Optimum Nutrition Gold Standard 100% Whey (5 lbs)', category: 'Supplements', stock: 12, price: 6899, costPrice: 4800, supplier: 'Bright Commodities', lowStockLimit: 4, salesCount: 18 },
  { id: 'INV-002', name: 'MuscleBlaze Creapure Creatine (250g)', category: 'Supplements', stock: 2, price: 1299, costPrice: 850, supplier: 'Bright Commodities', lowStockLimit: 5, salesCount: 32 }, // Triggering stock alert
  { id: 'INV-003', name: 'Fit X Premium Dri-Fit Gym T-Shirt', category: 'Merchandise', stock: 15, price: 799, costPrice: 350, supplier: 'Vogue Tex India', lowStockLimit: 3, salesCount: 25 },
  { id: 'INV-004', name: 'Fit X Stainless Steel Protein Shaker', category: 'Merchandise', stock: 8, price: 499, costPrice: 180, supplier: 'Vogue Tex India', lowStockLimit: 3, salesCount: 14 },
  { id: 'INV-005', name: 'Professional Leather Lifting Belt (Power)', category: 'Accessories', stock: 3, price: 2199, costPrice: 1100, supplier: 'Sardar Sports', lowStockLimit: 2, salesCount: 8 },
  { id: 'INV-006', name: 'Anti-Slip Gym Gloves (Padded)', category: 'Accessories', stock: 0, price: 599, costPrice: 250, supplier: 'Sardar Sports', lowStockLimit: 3, salesCount: 22 } // Out of Stock
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'ATT-1001', memberId: 'MEM-9021', memberName: 'Kabir Malhotra', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', role: 'Member', date: '2026-07-16', checkIn: '06:15 AM', checkOut: '07:45 AM', duration: 90, status: 'On Time' },
  { id: 'ATT-1002', memberId: 'MEM-3184', memberName: 'Anjali Deshmukh', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', role: 'Member', date: '2026-07-16', checkIn: '07:05 AM', checkOut: '08:20 AM', duration: 75, status: 'On Time' },
  { id: 'ATT-1003', memberId: 'MEM-5629', memberName: 'Gaurav Paswan', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', role: 'Member', date: '2026-07-16', checkIn: '08:45 AM', checkOut: undefined, duration: undefined, status: 'Late' }, // Currently inside!
  { id: 'ATT-1004', memberId: 'STF-02', memberName: 'Ronny Singh', role: 'Staff', date: '2026-07-16', checkIn: '05:55 AM', checkOut: undefined, duration: undefined, status: 'On Time' },
  { id: 'ATT-1005', memberId: 'STF-04', memberName: 'Neha Kapoor', role: 'Staff', date: '2026-07-16', checkIn: '06:00 AM', checkOut: undefined, duration: undefined, status: 'On Time' }
];

export const MOCK_REVIEWS = [
  { id: '1', name: 'Aashish Juneja', rating: 5, text: 'Best gym in the city! High density heavy dumbbell racks up to 60kg, premium rogue bumper plates, and a state of the art steam chamber. सिद्धार्थ भाई knows bodybuilding in and out. Highly recommended!', date: '2 weeks ago' },
  { id: '2', name: 'Tanvi Shah', rating: 5, text: 'I signed up for the quarterly package and Maria’s personal coaching completely fixed my strength parameters and diet discipline. Safe environment for women with professional trainers.', date: '1 month ago' },
  { id: '3', name: 'Rajesh Kulkarni', rating: 5, text: 'Awesome experience, premium cleanliness is maintained. The QR scanner check-in system is super convenient and I can track all my gym statistics in the member app. Truly worth every rupee!', date: '3 days ago' }
];
