'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CreditCard, ArrowRight, ShieldCheck, Check, RefreshCw, X, Train, Building, Calendar, Sparkles, CheckCircle, Smartphone, Database } from 'lucide-react';
import { Destination } from '../data/mockData';
import GlassCard from '../components/GlassCard';
import confetti from 'canvas-confetti';

interface CartItem {
  id: string;
  type: string;
  title: string;
  price: number;
  provider: string;
  details: string;
}

interface BookingViewProps {
  setActiveView: (view: string) => void;
  cartItems: CartItem[];
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  selectedDest: Destination | null;
  addUpcomingTrip: (trip: { id: string; name: string; date: string; status: string; itemsCount: number }) => void;
  isOffline: boolean;
}

export default function BookingView({
  setActiveView,
  cartItems,
  removeFromCart,
  clearCart,
  selectedDest,
  addUpcomingTrip,
  isOffline
}: BookingViewProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'loading' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('traveler@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 9845 1102 7834');
  const [activeVendor, setActiveVendor] = useState('');

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutStep('loading');
    
    const providers = Array.from(new Set(cartItems.map(i => i.provider)));
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < providers.length) {
        // If offline, simulate loading local database caches rather than live handshakes
        setActiveVendor(isOffline ? `PWA Cache - ${providers[index]}` : providers[index]);
        index++;
      } else {
        clearInterval(interval);
        setCheckoutStep('payment');
      }
    }, 1200);
  };

  const handlePayment = () => {
    setCheckoutStep('loading');
    setActiveVendor(isOffline ? 'Offline Queue Buffer' : 'Merchant Payment Processing');
    
    setTimeout(() => {
      setCheckoutStep('success');
      
      addUpcomingTrip({
        id: Math.random().toString(),
        name: selectedDest ? selectedDest.name : 'Indian Heritage Escape',
        date: '2026-10-12',
        status: isOffline ? 'Cached (Pending Sync)' : 'Confirmed',
        itemsCount: cartItems.length
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 2000);
  };

  const handleReturn = () => {
    clearCart();
    setCheckoutStep('cart');
    setActiveView('dashboard');
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-6 py-8 flex flex-col space-y-8 min-h-[calc(100vh-140px)] transition-all duration-300 ${
      isOffline ? 'filter saturate-75 opacity-90' : ''
    }`}>
      
      {/* Title */}
      <div>
        <span className="text-xs text-saffron-radiance font-semibold uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> 
          {isOffline ? 'Offline checkout queue active' : 'Secure checkout gateway active'}
        </span>
        <h1 className="text-3xl font-bold font-display text-white mt-1">Bookings & Integrations</h1>
      </div>

      {isOffline && checkoutStep === 'cart' && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3 text-left">
          <Database className="h-5 w-5 text-saffron-radiance flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-white">Offline Mode Active:</span>
            <p className="text-text-muted mt-1 leading-relaxed">
              GOBRO is operating in offline mode. Bookings will be queued in local database caches and automatically synchronized when your internet connection is restored.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {checkoutStep === 'cart' && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left"
          >
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-saffron-radiance" />
                Selected Tickets & Stays
              </h2>

              {cartItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="glassmorphism rounded-2xl p-4 flex items-center justify-between border border-white/5 bg-white/2 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-saffron-radiance">
                      {item.type.includes('Hotel') ? <Building className="h-5 w-5" /> : <Train className="h-5 w-5" />}
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">
                        {item.provider} &bull; {item.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">{item.title}</h4>
                      <p className="text-[10px] text-text-body">{item.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold text-saffron-radiance">₹{item.price}</span>
                    <button 
                      onClick={() => removeFromCart(idx)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6">
                  <p className="text-sm text-text-muted">Your booking cart is empty.</p>
                  <p className="text-xs text-text-muted mt-1">Navigate to the Itinerary Planner or Explore grid to select items.</p>
                  <button
                    onClick={() => setActiveView('discover')}
                    className="mt-4 text-xs text-saffron-radiance hover:underline font-semibold"
                  >
                    Search Destinations &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Total Pricing panel */}
            <div className="lg:col-span-1">
              <GlassCard hoverEffect={false} className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Summary</h3>
                
                <div className="space-y-2.5 text-xs text-text-muted border-b border-white/5 pb-3">
                  <div className="flex justify-between">
                    <span>Base Amount</span>
                    <span className="text-white font-semibold">₹ {cartTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrated Partner Fees</span>
                    <span className="text-white font-semibold">₹ {cartItems.length > 0 ? 180 : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST/SGST (18%)</span>
                    <span className="text-white font-semibold">₹ {Math.round(cartTotal * 0.18)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-white pt-2">
                  <span>Grand Total</span>
                  <span className="text-saffron-radiance">₹ {cartTotal + (cartItems.length > 0 ? 180 : 0) + Math.round(cartTotal * 0.18)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full mt-4 bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 transition-transform flex items-center justify-center gap-1.5"
                >
                  {isOffline ? 'Queue Offline Checkout' : 'Checkout Secure Gates'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {checkoutStep === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto w-full glassmorphism rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
          >
            <RefreshCw className="h-10 w-10 text-saffron-radiance animate-spin mb-6" />
            <span className="text-[10px] font-mono tracking-widest text-saffron-radiance uppercase block mb-1">
              {isOffline ? 'Indexing Local Caches' : 'Establishing Sandbox Connection'}
            </span>
            <h3 className="text-base font-semibold text-white">Communicating with {activeVendor || 'integrated APIs'}...</h3>
            <p className="text-[11px] text-text-muted mt-2 max-w-xs leading-relaxed">
              {isOffline 
                ? 'Allocating temporary transaction vouchers inside IndexedDB schema grids.'
                : 'Verifying transaction ledger coordinates, booking classes, and security keys. Do not reload page.'}
            </p>
          </motion.div>
        )}

        {checkoutStep === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto w-full glassmorphism rounded-3xl p-6 md:p-8 text-left"
          >
            <h2 className="text-xl font-bold font-display text-white mb-6">
              {isOffline ? 'Offline Payment Simulator' : 'Simulated Billing Portal'}
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">Payment Type</label>
                <div className="flex border border-white/10 rounded-xl bg-black/40 p-1">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'upi' ? 'bg-saffron-radiance text-black' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> UPI (GPay/PhonePe)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' ? 'bg-velvet-rose text-white' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> Credit Card
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider">UPI ID Reference</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-black/45 text-sm text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-saffron-radiance/50"
                  />
                  <span className="text-[10px] text-text-muted">
                    {isOffline ? 'Enter details. The transaction will complete offline and verify post-reconnect.' : 'Enter a mock ID to trigger simulated mobile authorization push.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-white uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-black/45 text-sm text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-velvet-rose/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-white uppercase tracking-wider">Expiry</label>
                      <input type="text" placeholder="12/29" className="w-full bg-black/45 text-sm text-white border border-white/10 rounded-xl p-3 focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-white uppercase tracking-wider">CVV</label>
                      <input type="password" placeholder="***" className="w-full bg-black/45 text-sm text-white border border-white/10 rounded-xl p-3 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-text-muted block">Authorized Charge</span>
                  <span className="text-sm font-bold text-white">₹ {cartTotal + (cartItems.length > 0 ? 180 : 0) + Math.round(cartTotal * 0.18)}</span>
                </div>
                <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> {isOffline ? 'OFFLINE LEDGER CACHE' : 'SECURE SANDBOX'}
                </span>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-velvet-rose to-saffron-radiance text-white font-bold text-xs tracking-wider py-4 rounded-2xl shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                {isOffline ? 'Queue Offline Ledger Authorize' : 'Authorize Payment Mockup'}
              </button>
            </div>
          </motion.div>
        )}

        {checkoutStep === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto w-full glassmorphism rounded-3xl p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-6 shadow-lg shadow-green-500/5">
              <CheckCircle className="h-8 w-8" />
            </div>

            <span className="text-[10px] font-mono tracking-widest text-green-400 uppercase block mb-1">
              {isOffline ? 'Voucher Queued Offline' : 'Booking Authenticated'}
            </span>
            
            <h2 className="text-xl font-bold font-display text-white mb-2">
              {isOffline ? 'Vouchers Saved to Device!' : 'Adventure Confirmed!'}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              {isOffline 
                ? 'Your bookings have been stored locally inside IndexedDB files. Vouchers will instantly register upon connecting back to sync channels.'
                : 'Your tickets, hotel check-ins, and local guides have been registered. Simulated API vouchers are synced below.'}
            </p>

            {/* Receipt Card */}
            <div className="w-full mt-6 p-4 rounded-2xl border border-white/5 bg-black/45 text-left font-mono text-[10px] space-y-2">
              <div className="flex justify-between text-white border-b border-white/10 pb-2 mb-2">
                <span>GOBRO Voucher</span>
                <span className="text-saffron-radiance">{isOffline ? 'OFFLINE_CACHED' : '#GOBRO-9843-26'}</span>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <span className="text-white">{selectedDest ? selectedDest.name : 'India'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-white">Oct 12, 2026</span>
              </div>
              <div className="flex justify-between">
                <span>Voucher Status:</span>
                <span className={`font-bold ${isOffline ? 'text-yellow-400' : 'text-green-400'}`}>
                  {isOffline ? 'PENDING SYNC' : 'SYNCED & OK'}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 mt-2 font-bold text-saffron-radiance">
                <span>Total Charge:</span>
                <span>₹ {cartTotal + (cartItems.length > 0 ? 180 : 0) + Math.round(cartTotal * 0.18)}</span>
              </div>

              {/* Barcode scanner */}
              <div className="pt-4 flex flex-col items-center space-y-1.5 border-t border-white/10 mt-2">
                <div className="h-20 w-44 bg-white/10 rounded border border-white/15 relative overflow-hidden flex flex-col justify-center items-center">
                  <div className="w-36 h-10 border-l border-r border-white flex justify-between">
                    {[...Array(14)].map((_, i) => (
                      <span key={i} className="h-full bg-white" style={{ width: i % 3 === 0 ? '1px' : i % 2 === 0 ? '3px' : '2px' }}></span>
                    ))}
                  </div>
                  <span className="text-[8px] text-text-muted mt-1 font-mono">{isOffline ? 'OFFLINE_VOUCHER_HASH' : 'GOBRO-CO-PILOT-SECURE'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReturn}
              className="w-full mt-6 bg-white text-black font-bold text-xs tracking-wide py-3.5 rounded-xl hover:bg-white/95 transition-colors"
            >
              Access My Trip Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
