import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">
        Welcome to JobBridge Nepal 🇳🇵
      </h1>
      <p className="text-gray-600 max-w-lg mb-8">
        Bridging informal workers and employers for fair, transparent, and
        ethical hiring.
      </p>
      <div className="space-x-4">
        <Link
          to="/register"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-100"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
