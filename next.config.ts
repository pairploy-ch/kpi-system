import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // กำหนด root ให้ชัด เพื่อตัด warning เรื่อง lockfile ซ้อนจากโฟลเดอร์ home
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
