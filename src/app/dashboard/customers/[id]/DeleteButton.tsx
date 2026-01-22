"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCustomerButton({
  customerId,
}: {
  customerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Möchtest du diesen Kunden wirklich löschen?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        alert("Fehler beim Löschen");
      }
    } catch {
      alert("Fehler beim Löschen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition disabled:opacity-50">
      {loading ? "..." : "🗑️ Löschen"}
    </button>
  );
}
