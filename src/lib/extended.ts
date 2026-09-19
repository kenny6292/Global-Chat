export type ExtendedFeature = {
  id: string;
  icon: string;
  title: string;
  description: string;
  status: "available" | "coming-soon";
};

export const extendedFeatures: ExtendedFeature[] = [
  { id: "feed", icon: "📰", title: "Global Feed", description: "Post updates, photos, questions and announcements for the wider community.", status: "available" },
  { id: "stories", icon: "✨", title: "Stories", description: "Share short-lived moments and discover what people are posting around the world.", status: "available" },
  { id: "events", icon: "📅", title: "Global Events", description: "Create and discover online and in-person events across countries and interests.", status: "coming-soon" },
  { id: "language", icon: "🌐", title: "Language Exchange", description: "Match with people who want to practice your language while you practice theirs.", status: "available" },
  { id: "channels", icon: "📣", title: "Channels", description: "Follow focused public channels for technology, gaming, business, culture and more.", status: "coming-soon" },
  { id: "live", icon: "🎙️", title: "Live Rooms", description: "Join live audio discussions, panels, interviews and community conversations.", status: "coming-soon" },
  { id: "polls", icon: "📊", title: "Polls & Questions", description: "Ask the global community questions and collect structured responses.", status: "available" },
  { id: "jobs", icon: "💼", title: "Global Opportunities", description: "Discover jobs, freelance opportunities, collaborations and professional connections.", status: "coming-soon" },
  { id: "creator", icon: "🎨", title: "Creator Hub", description: "Build a public creator profile, publish work and grow an audience.", status: "coming-soon" },
  { id: "saved", icon: "🔖", title: "Saved", description: "Keep useful conversations, posts and resources in one personal library.", status: "available" },
  { id: "translate", icon: "🔤", title: "Instant Translation", description: "Translate conversations across supported languages without leaving the chat.", status: "coming-soon" },
  { id: "verification", icon: "✓", title: "Identity & Community Verification", description: "Optional verification signals for profiles, organizations and trusted communities.", status: "coming-soon" }
];

export const extendedFeed = [
  { id: "1", name: "Global Tech Community", tag: "Technology", text: "What technology are you most excited to learn this year?", likes: 128, comments: 34 },
  { id: "2", name: "Travel Around The World", tag: "Travel", text: "Share one place everyone should experience at least once.", likes: 94, comments: 27 },
  { id: "3", name: "Global Creators", tag: "Creators", text: "Show the world what you are building.", likes: 76, comments: 19 }
];

export const extendedStories = [
  { id: "s1", name: "Global Chat", emoji: "🌎" },
  { id: "s2", name: "Tech", emoji: "💻" },
  { id: "s3", name: "Gaming", emoji: "🎮" },
  { id: "s4", name: "Travel", emoji: "✈️" },
  { id: "s5", name: "Music", emoji: "🎵" }
];
