import React, { useState, useEffect, useRef } from "react";

// This interface defines the structure for a single chat message.
interface Message {
  sender: "user" | "nenrin";
  content: string;
  timestamp: string;
}

// This interface defines the structure for a complete conversation demo.
interface ConversationDemo {
  title: string;
  messages: Message[];
}

// Data structure containing all conversation demos (no changes here)
const conversationDemos: ConversationDemo[] = [
  // English
  { title: "Simple Reminder", messages: [ { sender: "user", content: "Remind me to drink water in 1 hour.", timestamp: "3:11 PM" }, { sender: "nenrin", content: "Of course! 💧 Reminder set for an hour from now.", timestamp: "3:11 PM" }] },
  { title: "Reminder Delivery", messages: [ { sender: "nenrin", content: "Reminder: Time to drink some water! 💧", timestamp: "4:11 PM" }, { sender: "user", content: "Thanks, Nenrin!", timestamp: "4:11 PM" }] },
  { title: "To-Do List", messages: [ { sender: "user", content: "Add 'Finish quarterly report' to my to-do list.", timestamp: "1:20 PM" }, { sender: "nenrin", content: "Added to your tasks! 🎁 Let's get it done.", timestamp: "1:20 PM" }] },
  { title: "Recipe Search", messages: [ { sender: "user", content: "What's a simple recipe for pancakes?", timestamp: "8:30 AM" }, { sender: "nenrin", content: "You'll need flour, eggs, milk, and sugar. Want the full recipe? 🥞", timestamp: "8:30 AM" }] },
  { title: "Set Personality", messages: [ { sender: "user", content: "From now on, call me 'The Boss'.", timestamp: "9:00 AM" }, { sender: "nenrin", content: "Yes, The Boss! 🫡 How can I assist you?", timestamp: "9:00 AM" }] },
  { title: "Recurring Reminder", messages: [ { sender: "user", content: "Remind me to join the weekly sync every Friday at 10 AM.", timestamp: "9:05 AM" }, { sender: "nenrin", content: "Got it! Recurring reminder for the weekly sync is set. ✅", timestamp: "9:05 AM" }] },
  { title: "Expert Guidance", messages: [ { sender: "user", content: "I want to learn to code, where do I start?", timestamp: "1:30 PM" }, { sender: "nenrin", content: "Starting with Python or JavaScript is a great idea. I can find you some tutorials! 💻", timestamp: "1:30 PM" }] },
  { title: "Journaling", messages: [ { sender: "user", content: "Journal: Today's meeting was very productive.", timestamp: "5:00 PM" }, { sender: "nenrin", content: "Noted in your journal! 📝", timestamp: "5:00 PM" }] },
  { title: "General Knowledge", messages: [ { sender: "user", content: "What's the capital of Nepal?", timestamp: "11:00 AM" }, { sender: "nenrin", content: "The capital of Nepal is Kathmandu! 🏔️", timestamp: "11:00 AM" }] },
  { title: "Task Summary", messages: [ { sender: "user", content: "Summarize my tasks for today.", timestamp: "9:00 AM" }, { sender: "nenrin", content: "Today's tasks: 'Finish quarterly report'. Anything else, The Boss? 🫡", timestamp: "9:01 AM" }] },
  // Indonesian
  { title: "Pengingat Sholat", messages: [ { sender: "user", content: "Ingatkan saya untuk sholat Ashar.", timestamp: "3:15 PM" }, { sender: "nenrin", content: "Tentu! Pengingat sholat Ashar sudah diatur. 🙏", timestamp: "3:15 PM" }] },
  { title: "Pengingat Terkirim", messages: [ { sender: "nenrin", content: "Pengingat: Sudah masuk waktu sholat Ashar. 🙏", timestamp: "3:30 PM" }, { sender: "user", content: "Terima kasih, Nenrin.", timestamp: "3:30 PM" }] },
  { title: "Daftar Tugas", messages: [ { sender: "user", content: "todo: Beli kado untuk ulang tahun Ibu.", timestamp: "10:00 AM" }, { sender: "nenrin", content: "Sudah masuk daftar tugas! 🎁 Jangan sampai lupa ya.", timestamp: "10:00 AM" }] },
  { title: "Cek Cuaca", messages: [ { sender: "user", content: "Bagaimana cuaca di Bandung besok?", timestamp: "8:00 PM" }, { sender: "nenrin", content: "Besok di Bandung diperkirakan cerah berawan dengan suhu sekitar 24°C. 🌤️", timestamp: "8:00 PM" }] },
  { title: "Simpan Alamat", messages: [ { sender: "user", content: "Simpan alamat Dinda: Jalan Kenari nomor 12.", timestamp: "11:30 AM" }, { sender: "nenrin", content: "Oke, alamat Dinda sudah disimpan! 👍", timestamp: "11:30 AM" }] },
  { title: "Rekomendasi Film", messages: [ { sender: "user", content: "Rekomendasi film horor Indonesia dong.", timestamp: "9:00 PM" }, { sender: "nenrin", content: "'Pengabdi Setan' sangat direkomendasikan! Mau info lebih lanjut? 👻", timestamp: "9:00 PM" }] },
  { title: "Resep Masakan", messages: [ { sender: "user", content: "Resep nasi goreng spesial?", timestamp: "6:00 PM" }, { sender: "nenrin", content: "Tentu! Anda butuh nasi, telur, bawang, dan kecap manis. Mau resep lengkapnya? 🍛", timestamp: "6:00 PM" }] },
  { title: "Berita Terbaru", messages: [ { sender: "user", content: "Berita terbaru hari ini apa?", timestamp: "7:00 AM" }, { sender: "nenrin", content: "Ada beberapa berita utama tentang ekonomi dan olahraga. Tertarik topik tertentu? 📰", timestamp: "7:00 AM" }] },
  { title: "Ubah Kepribadian", messages: [ { sender: "user", content: "Mulai sekarang, bicaralah lebih formal.", timestamp: "1:00 PM" }, { sender: "nenrin", content: "Baik, permintaan Anda telah diterima. Saya akan berkomunikasi dengan lebih formal.", timestamp: "1:00 PM" }] },
  { title: "Rangkuman Tugas", messages: [ { sender: "user", content: "Rangkum semua tugasku untuk hari ini.", timestamp: "8:00 AM" }, { sender: "nenrin", content: "Tugas Anda hari ini: 'Beli kado untuk ulang tahun Ibu'.", timestamp: "8:01 AM" }] },
  // Spanish
  { title: "Recordatorio Simple", messages: [ { sender: "user", content: "Recuérdame llamar a mi abuela a las 7pm.", timestamp: "6:00 PM" }, { sender: "nenrin", content: "¡Claro! Recordatorio para llamar a la abuela a las 7pm. 👵", timestamp: "6:00 PM" }] },
  { title: "Entrega de Recordatorio", messages: [ { sender: "nenrin", content: "Recordatorio: ¡Es hora de llamar a la abuela! 👵", timestamp: "7:00 PM" }, { sender: "user", content: "¡Gracias, Nenrin!", timestamp: "7:00 PM" }] },
  { title: "Lista de Tareas", messages: [ { sender: "user", content: "Añade 'estudiar español' a mis tareas.", timestamp: "10:00 AM" }, { sender: "nenrin", content: "¡Añadido! ¡Vamos a aprender! 📚", timestamp: "10:00 AM" }] },
  { title: "Definición de Palabra", messages: [ { sender: "user", content: "¿Qué significa 'nostalgia'?", timestamp: "4:00 PM" }, { sender: "nenrin", content: "Nostalgia es un sentimiento de anhelo por un tiempo pasado. ✨", timestamp: "4:00 PM" }] },
  { title: "Diario de Sueños", messages: [ { sender: "user", content: "Diario: Hoy soñé que podía volar.", timestamp: "8:00 AM" }, { sender: "nenrin", content: "¡Qué sueño increíble! Guardado en tu diario. 🕊️", timestamp: "8:00 AM" }] },
  { title: "Dato Curioso", messages: [ { sender: "user", content: "Dime un dato curioso.", timestamp: "12:00 PM" }, { sender: "nenrin", content: "¿Sabías que los pulpos tienen tres corazones? 🐙", timestamp: "12:00 PM" }] },
  { title: "Recordatorio Recurrente", messages: [ { sender: "user", content: "Recuérdame el cumpleaños de mamá cada 15 de mayo.", timestamp: "2:00 PM" }, { sender: "nenrin", content: "¡Hecho! Recordatorio anual para el 15 de mayo. 🎂", timestamp: "2:00 PM" }] },
  { title: "Receta Simple", messages: [ { sender: "user", content: "Receta simple de gazpacho.", timestamp: "1:00 PM" }, { sender: "nenrin", content: "Necesitarás tomates, pimientos, pepino y ajo. ¿Quieres la receta completa? 🍅", timestamp: "1:00 PM" }] },
  { title: "Evento Histórico", messages: [ { sender: "user", content: "¿Quién pintó la Mona Lisa?", timestamp: "5:00 PM" }, { sender: "nenrin", content: "La Mona Lisa fue pintada por Leonardo da Vinci. 🎨", timestamp: "5:00 PM" }] },
  { title: "Resumen de Tareas", messages: [ { sender: "user", content: "Resume mis tareas para mañana.", timestamp: "9:00 PM" }, { sender: "nenrin", content: "Para mañana tienes: 'estudiar español'. ¡Que tengas un día productivo! 📚", timestamp: "9:01 PM" }] },
];


// --- NEW HELPER FUNCTION ---
/**
 * Creates and returns a shuffled array of numbers from 0 to size - 1.
 * Uses the Fisher-Yates (aka Knuth) shuffle algorithm for an unbiased shuffle.
 */
function createShuffledIndices(size: number): number[] {
  // 1. Create an array of indices [0, 1, 2, ...]
  const indices = Array.from({ length: size }, (_, i) => i);

  // 2. Shuffle the array in-place
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]; // Swap elements
  }

  return indices;
}


// PhoneMockup component remains unchanged
function PhoneMockup({ conversation, title }: { conversation: Message[], title: string }) {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentMessages(conversation);
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversation]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentMessages]);

  return (
    <div className="w-80 mx-auto">
      <div className="bg-black rounded-3xl p-2 shadow-xl">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="bg-[#1F5E42] px-6 py-4 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 40 40" width={20} height={20}>
                <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeWidth="3"/>
                <circle cx="20" cy="20" r="12" fill="none" stroke="white" strokeWidth="2.5" opacity=".6"/>
                <circle cx="20" cy="20" r="6"  fill="none" stroke="white" strokeWidth="2" opacity=".4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-white/80 text-xs">Nenrin Assistant</p>
            </div>
          </div>
          <div ref={chatContainerRef} className="bg-[#F4F6F5] p-4 h-96 overflow-y-auto flex flex-col">
            <div className="space-y-2 mt-auto">
              {currentMessages.map((message, index) => (
                <div key={index}>
                  <p className={`text-xs text-gray-500 mb-1 ${message.sender === 'user' ? 'text-right mr-3' : 'ml-3'}`}>
                    {message.sender === 'user' ? 'User' : 'Nenrin'}
                  </p>
                  <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${ message.sender === "user" ? "bg-green-200 text-gray-800" : "bg-white border border-gray-200 text-gray-800" }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">{message.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- REWRITTEN ChatDemo COMPONENT WITH SHUFFLE LOGIC ---
export default function ChatDemo() {
  const [playhead, setPlayhead] = useState(0);
  const [shuffledIndices, setShuffledIndices] = useState(() => 
    createShuffledIndices(conversationDemos.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const nextPlayhead = playhead + 1;

      // Check if we've reached the end of the shuffled list
      if (nextPlayhead >= shuffledIndices.length) {
        // Time to reshuffle for the next cycle
        const lastIndex = shuffledIndices[shuffledIndices.length - 1];
        let newShuffledIndices = createShuffledIndices(conversationDemos.length);

        // Optional: Ensure the new cycle doesn't start with the same item it ended on
        if (newShuffledIndices[0] === lastIndex) {
          // A simple fix: swap the first and last elements of the new list
          [newShuffledIndices[0], newShuffledIndices[newShuffledIndices.length - 1]] = 
          [newShuffledIndices[newShuffledIndices.length - 1], newShuffledIndices[0]];
        }
        
        setShuffledIndices(newShuffledIndices);
        setPlayhead(0); // Reset playhead to the start of the new list
      } else {
        // Just advance to the next item in the current list
        setPlayhead(nextPlayhead);
      }
    }, 4000); // Cycle every 4 seconds

    return () => clearInterval(interval);
  }, [playhead, shuffledIndices]); // Re-run effect if playhead or the list itself changes

  // Determine the actual index to display from our shuffled list
  const currentIndex = shuffledIndices[playhead];
  const currentDemo = conversationDemos[currentIndex];

  return (
    <div>
      <PhoneMockup 
        key={currentIndex} 
        conversation={currentDemo.messages} 
        title={currentDemo.title} 
      />
    </div>
  );
}