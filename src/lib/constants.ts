export interface Country {
  name: string;
  code: string;
  flag: string;
}

// The Google account that is treated as the Cherry Labs admin.
// Signing in with this exact email routes into the Admin Panel instead
// of the normal member onboarding/dashboard flow.
export const ADMIN_EMAIL = 'hello.cherrylabs@gmail.com';

// Suggestion chat rate limit
export const SUGGESTION_DAILY_LIMIT = 4;
export const SUGGESTION_WINDOW_MS = 24 * 60 * 60 * 1000;

// VIP welcome pass duration
export const VIP_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

export const COUNTRIES: Country[] = [
  { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
];

export const TANZANIA_REGIONS: string[] = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi',
  'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro',
  'Mtwara', 'Mwanza', 'Njombe', 'Pemba North', 'Pemba South', 'Pwani',
  'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora',
  'Tanga', 'Zanzibar North', 'Zanzibar South', 'Zanzibar West',
];

export const EMPLOYEE_ROLES = ['Influencer', 'Developer', 'Model', 'Advertiser'];

export const READING_PARAGRAPHS_FALLBACK = [
  {
    id: 1,
    title: 'Welcome to the Cherry Labs Inc. Membership',
    content: 'Becoming an official member of Cherry Labs Inc. transforms your experience from a standard user to a recognized, active stakeholder within our growing ecosystem. Below is a detailed overview of every privilege, financial return, and exclusive opportunity your membership unlocks.'
  },
  {
    id: 2,
    title: 'Platform Recognition & 3-Month VIP All-Access',
    content: 'The moment you activate your membership, you receive immediate sitewide recognition across all Cherry Labs Inc. platforms. To welcome you aboard, every new member receives an exclusive 3-Month VIP Pass. For ninety days, you get completely free, unrestricted access to all premium features, tools, and platforms across our entire ecosystem. You also receive real-time updates and direct notifications for any structural or platform changes before anyone else.'
  },
  {
    id: 3,
    title: 'Real-Time Governance & Direct Decision-Making',
    content: 'Members hold real authority over how Cherry Labs operates and evolves. You gain the direct power to flag and address real-time platform issues anytime, anywhere, and without any friction or disturbance. Furthermore, membership grants you direct decision-making privileges, giving you an active vote on critical choices, platform directions, and future feature implementations.'
  },
  {
    id: 4,
    title: '5% Indirect Asset Ownership & Annual Profit Distribution',
    content: 'We believe in sharing our success with the community driving our platform. Non-employee members collectively hold a 5% pool of indirect company assets. At the end of every fiscal year, company profits are calculated and distributed back to members. Your individual return is determined by your platform engagement, active contributions, and overall performance score on the site over the course of the year.'
  },
  {
    id: 5,
    title: 'Direct Employment Pathways',
    content: 'Membership serves as the primary gateway to joining our internal team. Active members gain exclusive eligibility to apply for official, paid employment positions within various internal sectors of Cherry Labs Inc., allowing you to turn your platform involvement into a formal career within the platform.'
  },
  {
    id: 6,
    title: 'Ecosystem Discounts, Functions & Priority Status',
    content: 'Beyond digital tools, members enjoy high-level ecosystem perks. You receive permanent priority status on all Cherry Labs activities, exclusive invitations to official company functions, and substantial discounts across all current and upcoming Cherry Labs services, tools, and platforms.'
  }
];
