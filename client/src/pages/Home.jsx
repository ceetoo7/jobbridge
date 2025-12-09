// client/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/all3x.png";
import carpenter from "../assets/carpenter.jpg";
import electrician from "../assets/electrician.jpg";
import plumber from "../assets/painter.jpg";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HERO SECTION */}
      <section className="flex flex-col md:flex-row items-center justify-between py-10 px-10 bg-primary text-white">
        {/* Text */}
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-extrabold leading-tight max-w-3xl">
            Connecting Workers & Employers Across Nepal
          </h2>
          <p className="mt-4 text-lg max-w-xl text-background">
            Find trusted gigs, fair wages, and real opportunities — without the
            middlemen.
          </p>

          <div className="mt-8 space-x-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg font-semibold bg-highlight text-black hover:bg-yellow-600"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-primary"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center md:justify-end">
          <img src={heroImage} alt="Hero" className="w-full  object-cover" />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-primary">
            Why JobBridge?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            <div className="p-8 bg-white rounded-xl shadow-md border-l-20 border-[#FFA62B]">
              <h4 className="text-xl font-semibold text-primary">Fair Wages</h4>
              <p className="mt-3 text-gray-600">
                We suggest fair wage ranges available in the market so you don’t
                get underpaid.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-md border-l-20 border-[#FFA62B]">
              <h4 className="text-xl font-semibold text-primary">
                Rating System
              </h4>
              <p className="mt-3 text-gray-600">
                Every employer and worker gets to rate each other to maintain
                transparency and accountability. It helps in building trust!
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-md border-l-20 border-[#FFA62B]">
              <h4 className="text-xl font-semibold text-primary">
                Location Based Gigs
              </h4>
              <p className="mt-3 text-gray-600">
                Workers get matched with gigs right in their district and area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SKILLS / SERVICES SECTION */}
      <section className="py-20 bg-accent">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-primary">
            Popular Skills
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            {/* Carpenter */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={carpenter}
                alt="Carpenter"
                className="w-full h-80 object-cover"
              />
              <div className="p-4 text-center bg-primary">
                <h4 className="font-semibold text-background text-lg">
                  Carpenter
                </h4>
              </div>
            </div>

            {/* Electrician */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={electrician}
                alt="Electrician"
                className="w-full h-80 object-cover"
              />
              <div className="p-4 text-center bg-primary">
                <h4 className="font-semibold text-background text-lg">
                  Electrician
                </h4>
              </div>
            </div>

            {/* Plumber */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={plumber}
                alt="Plumber"
                className="w-full h-80 object-cover"
              />
              <div className="p-4 text-center bg-primary">
                <h4 className="font-semibold text-background text-lg">
                  Painter
                </h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-accent py-20 text-center">
        <h3 className="text-3xl font-bold text-primary">
          Ready to Get Started?
        </h3>
        <p className="mt-3 text-primary">
          Whether you're an employer or a worker — we've got your back.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block px-8 py-3 bg-highlight text-black font-semibold rounded-lg hover:bg-yellow-600"
        >
          Join Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary text-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm">
          © 2025 JobBridge Nepal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
