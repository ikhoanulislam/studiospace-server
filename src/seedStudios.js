
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Studio = require("./models/Studio");

dotenv.config();

const studios = [
  {
    id: "studio-01",
    name: "The Creative Room",
    category: "Music Suite",
    location: "New York",
    price: 85,
    rating: 4.9,
    reviews: 128,
    description: "A professional music recording studio.",
  },
  {
    id: "studio-02",
    name: "Lightbox Studio",
    category: "Photography",
    location: "Brooklyn",
    price: 65,
    rating: 4.8,
    reviews: 96,
    description: "A modern photography studio.",
  },
  {
    id: "studio-03",
    name: "The Podcast House",
    category: "Podcast Lounge",
    location: "Los Angeles",
    price: 55,
    rating: 4.9,
    reviews: 112,
    description: "A comfortable podcast recording space.",
  },
  {
    id: "studio-04",
    name: "Frame Studios",
    category: "Film & Production",
    location: "Austin",
    price: 120,
    rating: 5.0,
    reviews: 84,
    description: "A professional film production studio.",
  },
  {
    id: "studio-05",
    name: "The Art Collective",
    category: "Art Workshop",
    location: "Portland",
    price: 45,
    rating: 4.8,
    reviews: 72,
    description: "A creative space for art and workshops.",
  },
  {
    id: "studio-06",
    name: "Soundwave Studio",
    category: "Music Suite",
    location: "Chicago",
    price: 95,
    rating: 4.9,
    reviews: 103,
    description: "A high-quality music recording studio.",
  },
];

async function seedStudios() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully!");

    for (const studio of studios) {
      await Studio.updateOne(
        { id: studio.id },
        { $set: studio },
        { upsert: true }
      );
    }

    console.log("6 Demo Studios Added Successfully!");
  } catch (error) {
    console.error("Seeding Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedStudios();
