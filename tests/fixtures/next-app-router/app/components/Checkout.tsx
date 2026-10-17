"use client";

import { useState } from "react";

export function Checkout() {
  const [status, setStatus] = useState("idle");

  async function pay() {
    setStatus("paying");
    await fetch("https://api.payments.example/charge", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PAYMENT_SECRET_KEY}` },
    });
    setStatus("done");
  }

  return (
    <button type="button" onClick={pay} disabled={status === "paying"}>
      Pay now
    </button>
  );
}
