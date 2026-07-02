"use client";

import React, { useState, useEffect, Suspense } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;
import { Clock, Calendar as CalendarIcon, CheckCircle2, ArrowLeft } from "lucide-react";
import { BookingCalendar } from "@/components/booking-calendar";

type Service = { id: string; name: string; price: number };

function BookingWidgetContent() {
  const searchParams = useSearchParams();
  const preselectedServiceName = searchParams.get("service");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<Service[]>([]);


  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [selectedTime, setSelectedTime] = useState<string>("");

  // Customer Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

  const [branchId, setBranchId] = useState<string>("");

  // 1. Load Services & Branches on Mount & Auto-Select
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, branchRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/v1/services`),
          fetch(`${getApiBaseUrl()}/api/v1/branches`)
        ]);
        
        if (branchRes.ok) {
          const branches = await branchRes.json();
          if (branches.length > 0) setBranchId(branches[0].id);
        }

        if (res.ok) {
          const data: Service[] = await res.json();
          setServices(data);
          
          if (preselectedServiceName) {
            // Aggressive matching: replace + with space, decode URL, lower case
            const decodedParam = decodeURIComponent(preselectedServiceName.replace(/\+/g, " "));
            const target = decodedParam.toLowerCase().trim().replace(/\s+/g, " ");
            const match = data.find(s => s.name.toLowerCase().trim().replace(/\s+/g, " ") === target);
            if (match) {
              setSelectedService(match);
              setStep(2); // Instantly jump to calendar!
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preselectedServiceName]);



  const handleBooking = async (paymentType: string) => {
    console.log("Processing payment via:", paymentType);
    if (!name || !phone || !selectedService || !selectedDate || !selectedTime) {
      alert("Please fill in all details.");
      return;
    }

    setSubmitting(true);
    try {
      const base = getApiBaseUrl();

      // 1. Parse time format (e.g. "10:00 AM" into 24-hour)
      const timeStr = selectedTime;
      const [time, modifier] = timeStr.split(" ");
      const timeParts = time.split(":");
      let hours = timeParts[0];
      const minutes = timeParts[1];
      if (hours === "12") {
        hours = "00";
      }
      if (modifier === "PM") {
        hours = parseInt(hours, 10) + 12 + "";
      }
      const appointmentTime = `${selectedDate}T${hours.padStart(2, '0')}:${minutes}:00Z`;

      // 2. Create Appointment
      const apptPayload = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        service_id: selectedService.id,
        branch_id: branchId,
        appointment_time: appointmentTime,
        status: "Pending",
        payment_status: "Unpaid"
      };

      const apptRes = await fetch(`${base}/api/v1/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apptPayload)
      });

      if (!apptRes.ok) {
        const err = await apptRes.json();
        throw new Error(err.detail || "Failed to book appointment.");
      }

      setStep(5); // Success step
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep(3); // Jump to time/therapist selection
  };

  const formatDisplayDate = (ymd: string) => {
    if (!ymd) return "";
    const date = new Date(ymd + "T12:00:00");
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] w-full bg-white/50 backdrop-blur-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // --- Right Pane Content Renderer ---
  const renderRightPane = () => {
    return (
      <AnimatePresence mode="wait">
        {step === 1 && (
          <MotionDiv 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h2 className="text-xl font-semibold mb-6">Select a Service</h2>
            <div className="grid gap-3">
              {services.map(s => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setStep(2);
                  }}
                  className="w-full p-4 border border-gray-200 rounded-xl text-left flex justify-between items-center hover:border-black hover:shadow-sm transition-all bg-white"
                >
                  <div>
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500 mt-1">1 hour (approx)</div>
                  </div>
                  <span className="font-medium">৳{s.price}</span>
                </button>
              ))}
            </div>
          </MotionDiv>
        )}

        {step === 2 && (
          <MotionDiv 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="flex items-center mb-6">
              {!preselectedServiceName && (
                <button onClick={() => setStep(1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className="text-xl font-semibold">Select a Date</h2>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <BookingCalendar value={selectedDate} onChange={handleDateSelect} />
            </div>
          </MotionDiv>
        )}

        {step === 3 && (
          <MotionDiv 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="flex items-center mb-6">
              <button onClick={() => setStep(2)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold">{formatDisplayDate(selectedDate)}</h2>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Select Time</h3>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map(time => (
                  <button 
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      setStep(4);
                    }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedTime === time 
                      ? "border-black bg-black text-white shadow-md" 
                      : "border-gray-200 bg-white hover:border-black text-gray-700"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </MotionDiv>
        )}

        {step === 4 && (
          <MotionDiv 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="flex items-center mb-6">
              <button onClick={() => setStep(3)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold">Your Details</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="017..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleBooking("Pay at Salon")}
                disabled={submitting || !name || !phone}
                className="w-full bg-black text-white p-4 rounded-xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
              >
                {submitting ? "Processing..." : "Confirm Booking (Pay at Salon)"}
              </button>
            </div>
          </MotionDiv>
        )}

        {step === 5 && (
          <MotionDiv 
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center text-center py-10"
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8 max-w-xs">
              Thank you {name}. Your appointment is confirmed and we look forward to seeing you.
            </p>
            
            <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">When</div>
              <div className="font-medium text-gray-900 mb-4">{formatDisplayDate(selectedDate)} at {selectedTime}</div>
              
              <div className="text-sm text-gray-500 mb-1">Service</div>
              <div className="font-medium text-gray-900">{selectedService?.name}</div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-0 md:p-8 font-sans">
      <div className="max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px] h-full md:h-auto">
        
        {/* Left Pane - Sticky Service Summary */}
        <div className="md:w-[40%] bg-gray-50 p-8 md:p-10 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-gray-100 to-transparent rounded-full blur-3xl opacity-50"></div>
          
          <div className="z-10 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-10 flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">BIW</span>
              </div>
              Beauty Intelligent Workspace
            </h1>

            {selectedService ? (
              <MotionDiv 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Service</div>
                  <div className="text-2xl font-semibold text-gray-900">{selectedService.name}</div>
                </div>

                <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-gray-600 gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <span className="font-medium">1 hr</span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-3">
                    <div className="w-[18px] text-center font-serif text-gray-400 italic">৳</div>
                    <span className="font-medium text-gray-900 text-lg">৳{selectedService.price}</span>
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <MotionDiv 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="pt-4 border-t border-gray-200 space-y-4"
                  >
                    <div className="flex items-start text-gray-600 gap-3">
                      <CalendarIcon size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{formatDisplayDate(selectedDate)}</div>
                        <div className="text-sm text-gray-500">{selectedTime}</div>
                      </div>
                    </div>
                  </MotionDiv>
                )}
              </MotionDiv>
            ) : (
              <div className="text-gray-400 font-medium">Please select a service to continue...</div>
            )}
          </div>
        </div>

        {/* Right Pane - Action Area */}
        <div className="md:w-[60%] p-8 md:p-12 overflow-y-auto max-h-[800px] bg-white relative">
          {renderRightPane()}
        </div>

      </div>
    </div>
  );
}

export default function BookingWidget() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div></div>}>
      <BookingWidgetContent />
    </Suspense>
  );
}
