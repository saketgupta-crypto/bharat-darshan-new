import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { Destination } from "../models/Destination";
import { Hotel } from "../models/Hotel";
import { Guide } from "../models/Guide";
import { slugify } from "../utils/text";

const destinations = [
  { name: "Taj Mahal, Agra", state: "Uttar Pradesh", region: "North", category: "Heritage", images: ["/Taj.jpeg"], attractions: ["Taj Mahal", "Agra Fort", "Mehtab Bagh"], bestTimeToVisit: "October to March", averageBudget: 15000, recommendedDuration: "2-3 days", coordinates: { lat: 27.1751, lng: 78.0421 }, featured: true, description: "The epitome of love and architectural marvel, this UNESCO World Heritage site is a must-visit destination showcasing Mughal grandeur." },
  { name: "Kerala Backwaters", state: "Kerala", region: "South", category: "Nature", images: ["/kerala.jpeg"], attractions: ["Alleppey houseboats", "Kumarakom", "Vembanad Lake"], bestTimeToVisit: "September to March", averageBudget: 25000, recommendedDuration: "4-5 days", coordinates: { lat: 9.4981, lng: 76.3388 }, featured: true, description: "Serene network of lagoons, lakes, and canals offering peaceful houseboat experiences through lush tropical landscapes." },
  { name: "Rajasthan Desert Safari", state: "Rajasthan", region: "West", category: "Adventure", images: ["/desert.jpeg"], attractions: ["Sam Sand Dunes", "Jaisalmer Fort", "Camel safari"], bestTimeToVisit: "October to February", averageBudget: 20000, recommendedDuration: "3-4 days", coordinates: { lat: 26.9157, lng: 70.9083 }, featured: true, description: "Experience the golden sands of Thar Desert with camel safaris, cultural performances, and starlit camping." },
  { name: "Varanasi Ghats", state: "Uttar Pradesh", region: "North", category: "Cultural", images: ["/varanasi.jpeg"], attractions: ["Dashashwamedh Ghat", "Ganga Aarti", "Kashi Vishwanath Temple"], bestTimeToVisit: "October to March", averageBudget: 12000, recommendedDuration: "2-3 days", coordinates: { lat: 25.3176, lng: 82.9739 }, featured: true, description: "Ancient spiritual city on the banks of Ganges, offering profound cultural experiences and traditional ceremonies." },
];

const hotels = [
  { name: "The Oberoi Amarvilas", location: "Agra, Uttar Pradesh", dest: "Taj Mahal, Agra", rating: 5, pricePerNight: 25000, images: ["/oberoi.webp"], amenities: ["Taj Mahal View", "Spa", "Fine Dining", "Pool"] },
  { name: "Kumarakom Lake Resort", location: "Kumarakom, Kerala", dest: "Kerala Backwaters", rating: 4.5, pricePerNight: 15000, images: ["/kumarakom-lake-resort.jpg"], amenities: ["Lake View", "Ayurveda Spa", "Backwater Access", "Traditional Cuisine"] },
  { name: "Suryagarh Palace", location: "Jaisalmer, Rajasthan", dest: "Rajasthan Desert Safari", rating: 4.8, pricePerNight: 20000, images: ["/suryagarh.avif"], amenities: ["Desert View", "Cultural Shows", "Camel Safari", "Royal Dining"] },
];

const guides = [
  { name: "Raju Kumar", location: "Agra, Uttar Pradesh", languages: ["Hindi", "English", "French"], rating: 4.9, profileImage: "/man.jpg", experienceYears: 15, bio: "15 years of heritage tourism expertise", specialization: ["Heritage"], pricePerDay: 3000 },
  { name: "Kaju Kumar", location: "Kerala", languages: ["Malayalam", "English", "German"], rating: 4.8, profileImage: "/man2.webp", experienceYears: 12, bio: "12 years specializing in backwater and cultural tours", specialization: ["Nature", "Cultural"], pricePerDay: 2800 },
];

async function main() {
  await connectDB();

  for (const d of destinations) {
    await Destination.updateOne({ slug: slugify(d.name) }, { $setOnInsert: { ...d, slug: slugify(d.name) } }, { upsert: true });
  }
  for (const { dest, ...h } of hotels) {
    const destination = await Destination.findOne({ slug: slugify(dest) }).select("_id");
    await Hotel.updateOne({ name: h.name }, { $setOnInsert: { ...h, destination: destination?._id, description: "" } }, { upsert: true });
  }
  for (const g of guides) {
    await Guide.updateOne({ name: g.name }, { $setOnInsert: { ...g, status: "ACTIVE" } }, { upsert: true });
  }
  console.log(`Seeded content: ${destinations.length} destinations, ${hotels.length} hotels, ${guides.length} guides (existing records untouched)`);

  const email = env.SEED_SUPER_ADMIN_EMAIL.toLowerCase();
  if (email && env.SEED_SUPER_ADMIN_PASSWORD) {
    if (!(await User.exists({ email }))) {
      await User.create({
        name: "Super Admin",
        email,
        passwordHash: await bcrypt.hash(env.SEED_SUPER_ADMIN_PASSWORD, 12),
        role: "SUPER_ADMIN",
        isEmailVerified: true,
      });
      console.log("Super admin created");
    }
  } else {
    console.log("SEED_SUPER_ADMIN_EMAIL/PASSWORD not set: skipped super admin creation");
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
