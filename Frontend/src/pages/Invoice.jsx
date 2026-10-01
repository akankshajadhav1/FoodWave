import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, ReceiptText } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount || 0);

const Invoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/api/orders/${id}`);
        if (isMounted) setOrder(data);
      } catch (err) {
        console.error("Failed to load invoice:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load this invoice.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[#292329]/60">Preparing your invoice…</div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p role="alert" className="font-semibold text-red-700">{error || "Invoice not found."}</p>
        <Link to="/orders" className="mt-5 inline-flex font-bold text-[#B85C3B]">Back to orders</Link>
      </div>
    );
  }

  const invoiceNumber = `FD-${new Date(order.createdAt).getFullYear()}-${order._id.slice(-8).toUpperCase()}`;
  const paymentLabel = order.paymentMethod === "COD"
    ? order.paymentStatus === "paid" ? "Paid · Cash on Delivery" : "Due · Cash on Delivery"
    : order.paymentStatus === "paid" ? "Paid online" : "Payment pending";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="invoice-no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-[#292329]/70 hover:text-[#B85C3B]">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#B85C3B] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#9f4c30]"
        >
          <Download className="h-4 w-4" />
          Download / Print PDF
        </button>
      </div>

      <article className="invoice-print overflow-hidden rounded-3xl border border-[#F0EAF8] bg-white shadow-lg">
        <header className="flex flex-col justify-between gap-8 bg-[#292329] p-8 text-white sm:flex-row sm:items-start sm:p-10">
          <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B85C3B]">
              <ReceiptText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Order invoice</h1>
            <p className="mt-2 text-sm text-white/65">Thank you for ordering with us.</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B9A7E0]">Invoice number</p>
            <p className="mt-2 text-lg font-extrabold">{invoiceNumber}</p>
            <p className="mt-2 text-sm text-white/70">
              {new Date(order.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
            </p>
          </div>
        </header>

        <div className="space-y-8 p-6 sm:p-10">
          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#292329]/50">Restaurant</p>
              <h2 className="mt-2 text-lg font-extrabold text-[#292329]">{order.restaurant?.name || "Restaurant"}</h2>
              {order.restaurant?.address && (
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#292329]/65">{order.restaurant.address}</p>
              )}
              {order.restaurant?.phone && (
                <p className="mt-1 text-sm text-[#292329]/65">{order.restaurant.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#292329]/50">Billed to / Delivery</p>
              <h2 className="mt-2 text-lg font-extrabold text-[#292329]">{order.user?.name || "Customer"}</h2>
              <p className="mt-1 text-sm leading-6 text-[#292329]/65">
                {order.deliveryAddress?.street}<br />
                {[order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.zipCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-1 text-sm text-[#292329]/65">{order.deliveryAddress?.phone || order.user?.phone}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#F0EAF8]">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 bg-[#F0EAF8] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#292329]/65 sm:grid">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Amount</span>
            </div>
            {order.items.map((item, index) => (
              <div
                key={`${item.foodItem || item.name}-${index}`}
                className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-[#F0EAF8] px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              >
                <span className="font-semibold text-[#292329]">{item.name}</span>
                <span className="text-right text-sm text-[#292329]/60">×{item.quantity}</span>
                <span className="hidden text-right text-sm text-[#292329]/70 sm:block">{formatCurrency(item.price)}</span>
                <span className="row-start-2 text-xs text-[#292329]/50 sm:row-auto sm:text-right sm:text-sm sm:text-[#292329]">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#292329]/50">Payment method</p>
                <p className="mt-1 font-semibold text-[#292329]">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#292329]/50">Payment status</p>
                <p className={`mt-1 font-bold ${order.paymentStatus === "paid" ? "text-green-700" : "text-[#B85C3B]"}`}>
                  {paymentLabel}
                </p>
              </div>
            </div>

            <div className="w-full space-y-3 sm:max-w-xs">
              <div className="flex justify-between gap-6 text-sm text-[#292329]/70">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-6 text-sm text-[#292329]/70">
                <span>Delivery fee</span>
                <span>{order.deliveryFee ? formatCurrency(order.deliveryFee) : "Free"}</span>
              </div>
              <div className="flex justify-between gap-6 text-sm text-[#292329]/70">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              {!!order.discount && (
                <div className="flex justify-between gap-6 text-sm text-green-700">
                  <span>Discount</span>
                  <span>−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-6 border-t border-[#292329]/15 pt-4 text-lg font-black text-[#292329]">
                <span>Total</span>
                <span className="text-[#B85C3B]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </section>

          <footer className="rounded-2xl bg-[#F0EAF8]/70 p-5 text-center">
            <p className="font-bold text-[#292329]">We appreciate your order!</p>
            <p className="mt-1 text-xs text-[#292329]/60">
              Order #{order._id.slice(-6).toUpperCase()} · Status: {order.orderStatus}
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
};

export default Invoice;
