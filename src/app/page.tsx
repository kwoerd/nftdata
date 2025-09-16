"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    const response = await fetch(`https://8453.insight.thirdweb.com/v1/${process.env.NEXT_PUBLIC_CLIENT_ID}/events?chain=8453&sort_by=block_number&sort_order=desc&limit=10`);
    const responseData = await response.json();
    setData(responseData.data);
    console.log(responseData.data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1>Blockchain Data</h1>
    </div>
  );
}
