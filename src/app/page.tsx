import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewArrivals from "@/components/NewArrivals";
import ShopByCategory from "@/components/ShopByCategory";
import FeaturedCollection from "@/components/FeaturedCollection";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. New Arrivals */}
        <NewArrivals />

        {/* 4. Shop By Category */}
        <ShopByCategory />

        {/* 5. Featured Collection */}
        <FeaturedCollection />

        {/* 6. Brand Story */}
        <BrandStory />

        {/* 7. Newsletter */}
        <Newsletter />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
