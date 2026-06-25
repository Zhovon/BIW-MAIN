"use client";

import React, { useState, useEffect, Suspense } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { useSearchParams } from "next/navigation";

// Define Types
type Service = { id: string; name: string; price: number };
type Employee = { id: string; full_name: string; role: string };

function BookingWidgetContent() {
  const searchParams = useSearchParams();
  const preselectedServiceName = searchParams.get("service");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Customer Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

  // 1. Load Services on Mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/services`);
        if (res.ok) {
          const data: Service[] = await res.json();
          setServices(data);
          
          if (preselectedServiceName) {
            const match = data.find(s => s.name.toLowerCase() === preselectedServiceName.toLowerCase());
            if (match) setSelectedService(match);
          }
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [preselectedServiceName]);

  // 2. Fetch Available Therapists when Date is selected
  useEffect(() => {
    if (selectedDate) {
      const fetchTherapists = async () => {
        try {
          // Hardcoding the default branch id for this widget, or passing "all"
          // In a multi-branch setup, the user would select the branch first.
          // For simplicity, we assume branch is handled by the backend or the first active branch is used.
          const res = await fetch(`${getApiBaseUrl()}/api/v1/appointments/available-employees?branch_id=all&date=${selectedDate}`);
          if (res.ok) {
            const data: Employee[] = await res.json();
            setAvailableEmployees(data);
          }
        } catch (err) {
          console.error("Failed to fetch employees", err);
        }
      };
      fetchTherapists();
    }
  }, [selectedDate]);

  const handleBooking = async (paymentType: string) => {
    if (!name || !phone || !selectedService || !selectedEmployee || !selectedDate || !selectedTime) {
      alert("Please fill in all details.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create a dummy customer or find by phone in the backend.
      // (The appointment endpoint currently expects customer_id. We should create customer first, or pass details)
      // Since this is a public widget, we will simulate the creation process.
      alert(`Booking confirmed for ${name}!\nPayment Method: ${paymentType}`);
      setStep(4); // Success step
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-serif">Loading Booking Engine...</div>;

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-[400px] border border-black p-6 font-serif shadow-sm">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Book Appointment</h1>
        <p className="text-sm italic text-gray-600">Secure your slot instantly</p>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">1. Select Service</label>
            <div className="grid grid-cols-1 gap-2">
              {services.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`p-3 border border-black text-left flex justify-between transition-colors ${selectedService?.id === s.id ? "bg-black text-white" : "hover:bg-gray-100"}`}
                >
                  <span className="font-bold">{s.name}</span>
                  <span>৳{s.price}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!selectedService}
            onClick={() => setStep(2)}
            className="w-full bg-black text-white p-3 font-bold uppercase tracking-wider mt-6 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">2. Select Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-3 border border-black font-sans"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 mt-4">3. Select Therapist</label>
              {availableEmployees.length === 0 ? (
                <p className="text-red-600 text-sm italic border border-red-200 bg-red-50 p-2">No therapists available on this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableEmployees.map(emp => (
                    <button 
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`p-2 border border-black text-sm transition-colors ${selectedEmployee?.id === emp.id ? "bg-black text-white" : "hover:bg-gray-100"}`}
                    >
                      <div className="font-bold">{emp.full_name}</div>
                      <div className="text-xs opacity-80">{emp.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEmployee && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 mt-4">4. Select Time</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(time => (
                  <button 
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 border border-black text-sm transition-colors ${selectedTime === time ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(1)} className="w-1/3 border border-black p-3 font-bold uppercase tracking-wider hover:bg-gray-100">Back</button>
            <button 
              disabled={!selectedTime}
              onClick={() => setStep(3)}
              className="w-2/3 bg-black text-white p-3 font-bold uppercase tracking-wider disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2">5. Your Details</label>
            <input 
              type="text" 
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-black mb-3 focus:outline-none"
            />
            <input 
              type="tel" 
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-black focus:outline-none"
            />
          </div>

          <div className="bg-gray-50 p-4 border border-black text-sm mt-4">
            <div className="font-bold mb-2 uppercase tracking-wider">Summary</div>
            <div className="flex justify-between mb-1"><span>Service:</span> <span>{selectedService?.name}</span></div>
            <div className="flex justify-between mb-1"><span>Therapist:</span> <span>{selectedEmployee?.full_name}</span></div>
            <div className="flex justify-between mb-1"><span>Time:</span> <span>{selectedDate} at {selectedTime}</span></div>
            <div className="flex justify-between mt-2 pt-2 border-t border-black font-bold text-lg">
              <span>Total:</span> <span>৳{selectedService?.price}</span>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <button 
              onClick={() => handleBooking("Pay at Salon")}
              disabled={submitting || !name || !phone}
              className="w-full bg-white border-2 border-black text-black p-3 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Pay at Salon
            </button>
            <button 
              onClick={() => handleBooking("Instant Payment")}
              disabled={submitting || !name || !phone}
              className="w-full bg-[#E3106D] text-white p-3 font-bold uppercase tracking-wider hover:bg-[#c40b5c] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              Instant Payment (bKash, Nagad, Card)
            </button>
          </div>
          
          <button onClick={() => setStep(2)} className="w-full text-center text-sm underline mt-4">Go Back</button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-10 animate-in zoom-in">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✓</div>
          <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">We look forward to seeing you, {name}.</p>
          <p className="text-sm border border-black p-3 bg-gray-50 inline-block">
            {selectedDate} @ {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
}

export default function BookingWidget() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-serif">Loading Booking Engine...</div>}>
      <BookingWidgetContent />
    </Suspense>
  );
}
